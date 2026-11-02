import os
import ssl
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me-123')
    DATABASE_URL = os.environ.get('DATABASE_URL')
    VERCEL_ENV = os.environ.get('VERCEL') or os.environ.get('VERCEL_ENV')

    if DATABASE_URL:
        # Strip sslmode query param — pg8000 uses ssl_context instead
        _uri = DATABASE_URL
        for _param in ('?sslmode=require', '&sslmode=require', '?sslmode=prefer', '&sslmode=prefer'):
            _uri = _uri.replace(_param, '')
        # Force pg8000 driver prefix
        _uri = _uri.replace('postgres://', 'postgresql+pg8000://').replace('postgresql://', 'postgresql+pg8000://')
        SQLALCHEMY_DATABASE_URI = _uri

        # pg8000 needs an ssl_context object, not the sslmode string
        _ssl = ssl.create_default_context()
        _ssl.check_hostname = False
        _ssl.verify_mode = ssl.CERT_NONE
        SQLALCHEMY_ENGINE_OPTIONS = {
            'connect_args': {'ssl_context': _ssl},
        }
    elif VERCEL_ENV:
        from sqlalchemy.pool import NullPool
        SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/pos.db'
        SQLALCHEMY_ENGINE_OPTIONS = {
            'connect_args': {'check_same_thread': False},
            'poolclass': NullPool,
        }
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'pos.db')
        SQLALCHEMY_ENGINE_OPTIONS = {
            'connect_args': {'check_same_thread': False},
        }

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ('true', '1', 'yes')
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or os.environ.get('MAIL_USERNAME') or 'noreply@techpower.africa'
    _report_recipients_str = os.environ.get('REPORT_RECIPIENT_EMAILS', '')
    REPORT_RECIPIENT_EMAILS = [email.strip() for email in _report_recipients_str.split(',') if email.strip()] if _report_recipients_str else []
    DAILY_REPORT_TIME = os.environ.get('DAILY_REPORT_TIME', '18:00')
