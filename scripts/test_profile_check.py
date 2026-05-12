import json
import urllib.request
import urllib.error
import sys
import time

BASE = 'http://localhost:5000'

def post(path, data):
    url = BASE + path
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.load(resp)

def get(path, token=None):
    url = BASE + path
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.load(resp)

if __name__ == '__main__':
    # small wait to allow server to start
    time.sleep(0.8)
    try:
        try:
            r = post('/api/register', {'username':'testuser_autotest','email':'test+autotest@example.com','password':'password123'})
            print('REGISTER:', json.dumps(r))
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8')
            print('REGISTER-ERROR', e.code, body)
        login = post('/api/login', {'email':'test+autotest@example.com','password':'password123'})
        print('LOGIN:', json.dumps(login))
        token = login.get('token')
        if not token:
            print('No token, aborting')
            sys.exit(1)
        profile = get('/api/user', token=token)
        print('PROFILE-GET:', json.dumps(profile))
        upd = post('/api/user', {'username':'testuser_autotest2','email':'test+autotest@example.com'}) if False else None
        # Use PUT via Request
        req = urllib.request.Request(BASE + '/api/user', data=json.dumps({'username':'testuser_autotest2','email':'test+autotest@example.com'}).encode('utf-8'), headers={'Content-Type':'application/json','Authorization':f'Bearer {token}'}, method='PUT')
        with urllib.request.urlopen(req, timeout=10) as resp:
            print('PROFILE-PUT:', json.dumps(json.load(resp)))
        # change password
        req2 = urllib.request.Request(BASE + '/api/user/password', data=json.dumps({'currentPassword':'password123','newPassword':'password1234'}).encode('utf-8'), headers={'Content-Type':'application/json','Authorization':f'Bearer {token}'}, method='PUT')
        with urllib.request.urlopen(req2, timeout=10) as resp:
            print('PASSWORD-CHANGE:', json.dumps(json.load(resp)))
    except Exception as e:
        print('ERROR', e)
        sys.exit(1)
