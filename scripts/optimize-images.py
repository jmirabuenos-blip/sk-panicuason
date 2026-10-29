"""Generate WebP assets with Pillow; keep original report pages for reading."""
from pathlib import Path
from PIL import Image, ImageOps
import re
root = Path(__file__).resolve().parent.parent
saved = original = count = 0
mapping = {}
for source in (root/'images').rglob('*'):
    if source.suffix.lower() not in ['.png', '.jpg', '.jpeg', '.jfif']: continue
    with Image.open(source) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        report = 'accomplishment-report' in source.parts
        im.thumbnail((640, 900) if report else ((360, 360) if source.stem == 'logo' else (1280, 1280)))
        target = source.with_suffix('.webp')
        im.save(target, 'WEBP', quality=82, method=6)
    original += source.stat().st_size
    saved += source.stat().st_size - target.stat().st_size
    count += 1
    mapping[source.relative_to(root).as_posix()] = target.relative_to(root).as_posix()
for path in list(root.glob('*.html')) + list((root/'admin').glob('*.html')) + list((root/'js').glob('*.js')) + list((root/'css').glob('*.css')):
    text = path.read_text(encoding='utf-8')
    for source, target in mapping.items():
        if 'accomplishment-report/' not in source: text = text.replace(source, target)
    if path.name == 'accomplishment-report.html': text = text.replace("+ i + '.png", "+ i + '.webp")
    text = re.sub(r'<img[^>]*>', lambda m: m[0].replace('loading="lazy"', 'loading="eager"') if 'logo.webp' in m[0] else m[0], text)
    path.write_text(text, encoding='utf-8')
print(f'{count} images: {original/1048576:.1f} MB original; {(original-saved)/1048576:.1f} MB optimized; {saved/original:.1%} smaller.')
