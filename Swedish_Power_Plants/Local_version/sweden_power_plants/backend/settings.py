"""
Django settings for the backend project.

Django + React port of the GeoDjango "Swedish Power Plants Map"
(https://github.com/ma-github-account/Web-App-Swedish-Power-Plants-Map).
Django is API-only here: it serves the compiled React bundle as a single
template and everything else over REST.

This is plain Django, not GeoDjango. Coordinates are two float columns rather
than a PostGIS PointField - the app never ran a spatial query, so GEOS/GDAL and
the PostGIS extension were pure deployment cost. Nothing here needs a native
library, which is what makes it deployable on a stock Python platform.
"""

import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# This is the LOCAL edition: SQLite, media on disk, nothing to configure. There
# is deliberately no .env - clone, install, migrate, run. The AWS edition of the
# same application swaps in PostgreSQL on RDS and S3 for media.
#
# The few settings below still read the environment so the app can be hardened
# without editing code, but every one has a working default.
IS_PRODUCTION = os.environ.get('IS_PRODUCTION', 'false').lower() == 'true'

# SECURITY WARNING: keep the secret key used in production secret.
# The fallback is a throwaway for local development only - it is published in
# this repository, so it must never be the key a deployed site runs on.
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-dev-only-key-not-for-deployment',
)

if IS_PRODUCTION and SECRET_KEY.startswith('django-insecure-'):
    raise ImproperlyConfigured(
        'IS_PRODUCTION is true but SECRET_KEY is still the development '
        'fallback. Set a real SECRET_KEY environment variable.'
    )

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = not IS_PRODUCTION

# '*' is fine for local development; in production the EB/ELB health checker
# calls the instance by its private IP, so that host has to be allowed too.
ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get('ALLOWED_HOSTS', '127.0.0.1,localhost').split(',') if h.strip()
] if IS_PRODUCTION else ['*']

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'rest_framework',
    'corsheaders',

    'base.apps.BaseConfig',
]


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',

    'JTI_CLAIM': 'jti',

    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'frontend/build')
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# SQLite: a single file, created on first `migrate`. No server to install, no
# credentials, nothing to configure - which is the whole point of this edition.
# It is bundled with Python, so it adds no dependency either.
#
# Everything the app does is ordinary relational work (no PostGIS, no JSON or
# array columns, no raw SQL), so the same models and the same migration run
# unchanged on PostgreSQL in the AWS edition.

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = '/static/'
MEDIA_URL = '/images/'

STATICFILES_DIRS = [
    BASE_DIR / 'static',
    BASE_DIR / 'frontend/build/static',
]

# Serve root-level build files (favicon.ico, manifest.json, etc.) via Whitenoise
WHITENOISE_ROOT = BASE_DIR / 'frontend/build'

MEDIA_ROOT = BASE_DIR / 'static/images'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Compressed, hashed static files with far-future cache headers. Requires the
# manifest that collectstatic writes, so it must stay off in development where
# collectstatic has not necessarily run.
if IS_PRODUCTION:
    STORAGES = {
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
    }

# Same-origin in production - Django serves the React bundle itself, so no
# cross-origin request should be needed. Left open in development for the CRA
# dev server on :3000.
CORS_ALLOW_ALL_ORIGINS = not IS_PRODUCTION
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') if o.strip()
]
