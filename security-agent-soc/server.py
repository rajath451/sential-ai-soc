import json
import os
import sys

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
import mimetypes

# Add parent directory to path for imports
parent_dir = os.path.dirname(__file__)
sys.path.insert(0, parent_dir)

frontend_dir = os.path.join(parent_dir, "frontend", "dist", "spa")
if not os.path.exists(frontend_dir):
    frontend_dir = os.path.join(parent_dir, "frontend")


from analysis import assess_log_text, serialize_assessments
from alerts import send_email_alert, send_slack_alert, send_firebase_alert
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))


class AppHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        """Translate path to serve from frontend directory."""
        path = urlparse(path).path
        parts = path.lstrip('/').split('/')
        
        # Serve from frontend directory
        filepath = os.path.join(frontend_dir, *parts)
        
        # Default to index.html for root
        if filepath.endswith('/') or path == '/':
            filepath = os.path.join(frontend_dir, 'index.html')
        
        return filepath

    def do_GET(self):
        # Parse the path
        parsed_path = urlparse(self.path).path
        
        print(f"DEBUG: GET request for path: {self.path}")
        print(f"DEBUG: parsed_path: {parsed_path}")
        
        # Check if it's the API endpoint
        if parsed_path.startswith('/api/'):
            self.send_error(HTTPStatus.METHOD_NOT_ALLOWED, "Use POST for API")
            return
        
        # Try to serve static files
        filepath = self.translate_path(self.path)
        print(f"DEBUG: filepath: {filepath}")
        print(f"DEBUG: file exists: {os.path.isfile(filepath)}")
        
        if os.path.isfile(filepath):
            try:
                with open(filepath, 'rb') as f:
                    content = f.read()
                
                # Determine content type
                content_type, _ = mimetypes.guess_type(filepath)
                if content_type is None:
                    content_type = 'application/octet-stream'
                
                print(f"DEBUG: serving {filepath} with type {content_type}")
                self.send_response(HTTPStatus.OK)
                self.send_header('Content-type', content_type)
                self.send_header('Content-length', len(content))
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                print(f"DEBUG: Exception in file serving: {e}")
                self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(e))
        else:
            # Fallback to index.html for unknown paths (SPA routing)
            fallback = os.path.join(frontend_dir, 'index.html')
            print(f"DEBUG: file not found, trying fallback: {fallback}")
            if os.path.isfile(fallback):
                try:
                    with open(fallback, 'rb') as f:
                        content = f.read()
                    print(f"DEBUG: serving fallback index.html")
                    self.send_response(HTTPStatus.OK)
                    self.send_header('Content-type', 'text/html')
                    self.send_header('Content-length', len(content))
                    self.end_headers()
                    self.wfile.write(content)
                except Exception as e:
                    print(f"DEBUG: Exception in fallback: {e}")
                    self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(e))
            else:
                print(f"DEBUG: fallback not found either")
                self.send_error(HTTPStatus.NOT_FOUND, "File not found")

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path != "/api/analyze":
            self.send_error(HTTPStatus.NOT_FOUND, "Unsupported POST endpoint")
            return

        length = int(self.headers.get("Content-Length", "0"))
        payload = self.rfile.read(length).decode("utf-8")
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid JSON")
            return

        log_text = data.get("log_text", "")
        send_alerts = bool(data.get("send_alerts", False))
        user_email = data.get("user_email")
        assessments = assess_log_text(log_text)
        response = {"results": serialize_assessments(assessments), "alerts": []}

        if send_alerts:
            for assessment in assessments:
                if assessment.priority in ("critical", "high"):
                    message = (
                        f"Security Alert - {assessment.priority.upper()}\n"
                        f"IP: {assessment.event.src_ip}\n"
                        f"Score: {assessment.score}\n"
                        f"Event: {assessment.event.event_type}\n"
                        f"Raw: {assessment.event.raw}"
                    )
                    ok, info = send_slack_alert(message)
                    response["alerts"].append({"type": "slack", "ok": ok, "info": info})
                    
                    # Target both default notify list and the logged-in user email
                    default_tos = [s.strip() for s in (os.getenv("ALERT_TO") or "").split(",") if s.strip()]
                    if user_email:
                        to_addrs = list(set(default_tos + [user_email]))
                    else:
                        to_addrs = default_tos

                    ok, info = send_email_alert(
                        subject=f"Security Alert: {assessment.priority.upper()} {assessment.event.src_ip}",
                        body=message,
                        to_addrs=to_addrs,
                    )
                    response["alerts"].append({"type": "email", "ok": ok, "info": info})

                    # Trigger real-time Firebase Cloud Messaging push notification dispatch
                    f_title = f"⚠️ SENTIAL AI: {assessment.priority.upper()} Threat"
                    f_body = f"IP {assessment.event.src_ip or 'Internal'} | {assessment.event.event_type}"
                    f_ok, f_info = send_firebase_alert(title=f_title, body=f_body)
                    response["alerts"].append({"type": "firebase", "ok": f_ok, "info": f_info})

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode("utf-8"))

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    print(f"Serving UI and API at http://localhost:{PORT}")
    with ThreadingHTTPServer(("", PORT), AppHandler) as server:
        server.serve_forever()
