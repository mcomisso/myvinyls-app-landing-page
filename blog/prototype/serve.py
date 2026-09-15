"""Throwaway: five blog designs on /blog/?variant=A. Run: python3 blog/prototype/serve.py."""
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
PROTOTYPE = ROOT / 'blog/prototype'

def posts():
    result = []
    for path in sorted((ROOT / '_posts').glob('*.md'), reverse=True):
        parts = path.read_text().split('---', 2)
        if len(parts) != 3:
            continue
        meta = dict(re.findall(r'^([a-z_]+):\s*(.+)$', parts[1], re.M))
        meta = {k: v.strip().strip('\"\'') for k, v in meta.items()}
        if not meta.get('image'):
            continue
        slug = path.stem[11:]
        meta.update(id=path.stem, url=f'https://myvinyls.app/blog/{path.stem[:4]}/{path.stem[5:7]}/{slug}/')
        # Use real opening paragraphs for a bounded reading preview.
        paragraphs = [p.strip() for p in parts[2].split('\n\n') if p.strip() and not p.lstrip().startswith(('#', '-', '*', '!', '|', '<', '{'))][:8]
        meta['paragraphs'] = [re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', p).replace('**', '').replace('\n', ' ') for p in paragraphs]
        result.append(meta)
    return result

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        route = urlsplit(self.path).path
        if route == '/prototype-data.json':
            payload = json.dumps(posts()).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        if route in ('/', '/blog', '/blog/'):
            self.path = '/blog/prototype/index.html'
        super().do_GET()

if __name__ == '__main__':
    print('Five throwaway blog prototypes: http://127.0.0.1:8765/blog/?variant=A', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
