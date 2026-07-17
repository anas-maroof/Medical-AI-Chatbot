import sys
import time
import json
from pathlib import Path
from functools import wraps

from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

from config import FLASK_SECRET_KEY, FLASK_DEBUG, FLASK_PORT
from src.rag_chain import build_rag_chain, build_streaming_chain, PROMPT
from src.vectorstore import load_vectorstore, get_retriever
from src.auth import register_user, login_user, verify_token
from src.logger import get_logger
from src.chat_store import (
    create_session, get_sessions, update_session_title,
    delete_session, save_messages, get_messages
)

log = get_logger(__name__)

def require_auth(f):
    @wraps(f)
    def decorated(*args,**kwargs):
        auth_header = request.headers.get("Authorization","")
        if not auth_header.startswith("Bearer"):
            return jsonify("error","Missing or invalid token"),401
        token = auth_header.split(" ")[1]
        result = verify_token(token)
        if not result["valid"]:
            return jsonify({"error":result["error"]}),401
        request.user_id = result["user_id"]
        request.user_email = result["email"]
        return f(*args,**kwargs)

    return decorated

def create_app():
    app = Flask(__name__)
    app.secret_key = FLASK_SECRET_KEY
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    log.info("Initializing RAG pipeline...")
    try:
        vs = load_vectorstore()
        retriever = get_retriever(vs)
        chain = build_rag_chain(retriever)
        app.config["CHAIN"] = chain
        app.config["RETRIEVER"] = retriever
        log.info("RAG Pipleline ready")
    except Exception as e:
        log.error(f"Failed to init RAG PIPELINE: {e}")
        app.config["CHAIN"] = None
        app.config["RETRIEVER"] = None

    @app.route("/api/health")
    def health():
        ready = app.config.get("CHAIN") is not None
        return jsonify({
            "status": "ok" if ready else "degraded",
            "model": "gemini-3.5-flash",
            "vectors": 28475,
            "ready": ready,
        }), 200 if ready else 503
    
    @app.route("/api/auth/register",methods=["POST"])
    def register():
        data = request.get_json(silent=True) or {}
        email    = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()
        full_name = (data.get("full_name") or "").strip()

        if not email or not password or not full_name:
            return jsonify({"error": "Email, password and full name are required"}), 400

        result = register_user(email, password, full_name)
        if not result["success"]:
            return jsonify({"error": result["error"]}), 409

        log.info(f"New user registered: {email}")
        return jsonify(result), 201

    @app.route("/api/auth/login",methods=["POST"])
    def login():
        data = request.get_json(silent=True) or {}
        email    = (data.get("email") or "").strip().lower()
        password = (data.get("password") or "").strip()

        if not email or not password:
            return jsonify({"error": "Email, password are required"}), 400

        result = login_user(email, password)
        if not result["success"]:
            return jsonify({"error": result["error"]}), 401

        return jsonify(result), 201

    @app.route("/api/auth/me")
    @require_auth
    def me():
        return jsonify({
            "user_id": request.user_id,
            "email": request.user_email,
        })
    
    @app.route("/api/sessions", methods=["GET"])
    @require_auth
    def list_sessions():
        sessions = get_sessions(request.user_id)
        return jsonify({"sessions": sessions})
    
    @app.route("/api/sessions", methods=["POST"])
    @require_auth
    def new_session():
        data = request.get_json(silent=True) or {}
        title = data.get("title", "New Chat")
        session = create_session(request.user_id, title)
        return jsonify(session), 201
    
    @app.route("/api/sessions/<session_id>", methods=["DELETE"])
    @require_auth
    def remove_session(session_id):
        delete_session(session_id, request.user_id)
        return jsonify({"success": True})
    
    @app.route("/api/sessions/<session_id>/messages", methods=["GET"])
    @require_auth
    def list_messages(session_id):
        messages = get_messages(session_id)
        return jsonify({"messages": messages})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error":"Route not found"}),404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error":"Internal server error"}),500
    
    return app

if __name__ == "__main__":
    app = create_app()
    log.info(f"🚀 MedBot starting on port {FLASK_PORT}")
    app.run(host="0.0.0.0", port=FLASK_PORT, debug=FLASK_DEBUG)