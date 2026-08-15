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

# Load .env if present. Django does not do this by itself, so without this a
# .env file would be silently ignored. Real environment variables win, which is
# what `eb setenv` relies on in production.
try:
    from dotenv import load_dotenv
except ImportError:
    pass
else:
    load_dotenv(BASE_DIR / '.env', override=False)

def env(name, default=''):
    """Environment lookup that treats an empty value as unset.

    `KEY=` in a .env file yields an empty string, and os.environ.get() would
    happily return that over the default - which is how an empty SECRET_KEY
    slips through and only fails deep inside a third-party app.
    """
    value = os.environ.get(name)
    return value if value not in (None, '') else default


# Same switch the other two Elastic Beanstalk apps use.
IS_PRODUCTION = env('IS_PRODUCTION', 'false').lower() == 'true'

# SECURITY WARNING: keep the secret key used in production secret!
# No default on purpose: this edition is meant to run on Elastic Beanstalk,
# where the key comes from `eb setenv`. Failing loudly beats booting with a
# key that is public in this repository.
SECRET_KEY = env('SECRET_KEY', '')   # - Enter via `eb setenv SECRET_KEY=...`

if not SECRET_KEY:
    raise ImproperlyConfigured(
        'SECRET_KEY is not set. Generate one with:\n'
        '  python -c "from django.core.management.utils import '
        'get_random_secret_key; print(get_random_secret_key())"\n'
        'then set it via `eb setenv SECRET_KEY=...` or export it in your shell.'
    )

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = not IS_PRODUCTION

# The ELB health checker calls the instance by its private IP, so that address
# has to be allowed too - '*' is the simplest way to cover it.
ALLOWED_HOSTS = (
    [h.strip() for h in env('ALLOWED_HOSTS', '').split(',') if h.strip()] or ['*']
)

CSRF_TRUSTED_ORIGINS = [
    o.strip() for o in env('CSRF_TRUSTED_ORIGINS', '').split(',') if o.strip()
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
    'storages',

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
# Plain PostgreSQL - no PostGIS extension required, so this schema can be
# created on a stock RDS instance as-is.

# RDS in production, a local PostgreSQL otherwise. Env var names match the
# other two Elastic Beanstalk apps so one `eb setenv` recipe covers all three.
# DB_USER rather than USER: on Linux, USER already holds the OS account name.
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('NAME', ''),          # - Enter your RDS database name HERE
        'USER': env('DB_USER', ''),       # - Enter your RDS username HERE
        'PASSWORD': env('PASSWORD', ''),  # - Enter your RDS password HERE
        'HOST': env('HOST', ''),          # - Enter your RDS endpoint HERE
        'PORT': env('DB_PORT', '5432'),
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

CORS_ALLOW_ALL_ORIGINS = True


# --------------------------------------------------------------------------
# Amazon S3 - user-uploaded media only
#
# Same split as the other two EB apps: the compiled React bundle is served as
# Django static files by WhiteNoise, while uploaded media (plant photos and
# type icons) lives in S3. Static must NOT go to S3 - index.html references
# /static/... with relative paths, and rewriting those to an S3 domain breaks
# the SPA shell.
# --------------------------------------------------------------------------

AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY', '')
AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME', '')  # - Enter your S3 bucket name HERE

AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', 'us-east-2')  # match the region your bucket is in
AWS_S3_CUSTOM_DOMAIN = '%s.s3.amazonaws.com' % AWS_STORAGE_BUCKET_NAME

# The bucket has Object Ownership = BucketOwnerEnforced, so ACLs are disabled;
# sending one would make every upload fail. Public read comes from the bucket
# policy instead, which is also why signed query strings are unnecessary.
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = False

# Only route media to S3 when a bucket is actually configured, so the project
# still runs from a plain checkout with no AWS credentials.
_MEDIA_BACKEND = (
    'storages.backends.s3boto3.S3Boto3Storage' if AWS_STORAGE_BUCKET_NAME
    else 'django.core.files.storage.FileSystemStorage'
)

STORAGES = {
    'default': {'BACKEND': _MEDIA_BACKEND},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}

if IS_PRODUCTION:
    # Hashes filenames and gzips. Needs the manifest collectstatic writes, so
    # it stays off locally where collectstatic may not have run.
    STORAGES['staticfiles'] = {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'}

# With S3 serving media, MEDIA_URL must point at the bucket rather than /images/.
if AWS_STORAGE_BUCKET_NAME:
    MEDIA_URL = 'https://%s/' % AWS_S3_CUSTOM_DOMAIN
