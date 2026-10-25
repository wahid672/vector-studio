"""Generate Vector Studio icons and social preview; requires Pillow, not needed by web builds."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / 'dist'
S = 8
INK, PAPER, ACCENT = '#222a29', '#f6f5f0', '#e97540'
icon = Image.new('RGBA', (64*S,64*S))
d = ImageDraw.Draw(icon)
def coords(points): return [(round(x*S),round(y*S)) for x,y in points]
d.rounded_rectangle((0,0,64*S-1,64*S-1),radius=16*S,fill=INK)
d.line(coords([(15,19),(31,47),(49,17)]),fill=PAPER,width=5*S,joint='curve')
curve=[]
for i in range(101):
    t=i/100;u=1-t
    curve.append((u**3*15+3*u*u*t*37+3*u*t*t*32+t**3*49,u**3*19+3*u*u*t*12+3*u*t*t*49+t**3*17))
d.line(coords(curve),fill=ACCENT,width=3*S,joint='curve')
for x,y in [(10,14),(26,42),(44,12)]:
    d.rounded_rectangle((x*S,y*S,(x+10)*S,(y+10)*S),radius=2*S,fill=ACCENT,outline=INK,width=2*S)
for size,name in [(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:
    icon.resize((size,size),Image.Resampling.LANCZOS).save(ROOT/name)
icon.save(ROOT/'favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])

def font(size,bold=False):
    base=Path('C:/Windows/Fonts')
    candidate=base/('arialbd.ttf' if bold else 'arial.ttf')
    return ImageFont.truetype(str(candidate),size) if candidate.exists() else ImageFont.truetype('DejaVuSans.ttf',size)
social=Image.new('RGB',(1200,630),PAPER);g=ImageDraw.Draw(social)
for x in range(810,1200,32):g.line((x,0,x,630),fill='#e6e9df')
for y in range(0,630,32):g.line((800,y,1200,y),fill='#e6e9df')
social.paste(icon.resize((78,78),Image.Resampling.LANCZOS),(66,56),icon.resize((78,78),Image.Resampling.LANCZOS))
g.text((164,66),'Vector Studio',font=font(40,True),fill=INK)
g.text((64,214),'Dari piksel,',font=font(82,True),fill=INK)
g.text((64,308),'jadi presisi.',font=font(82,True),fill=ACCENT)
g.text((68,438),'Konversi PNG, JPG & WebP ke SVG',font=font(28),fill='#5f6e61')
g.rounded_rectangle((68,516,528,566),radius=25,fill='#e8eee1')
g.text((91,527),'Gratis  /  Unlimited colors  /  Privat',font=font(22),fill='#3f795b')
social.paste(icon.resize((225,225),Image.Resampling.LANCZOS),(902,229),icon.resize((225,225),Image.Resampling.LANCZOS))
social.save(ROOT/'social-preview.png',optimize=True)
print('Generated favicon, icons, and 1200x630 social preview.')
