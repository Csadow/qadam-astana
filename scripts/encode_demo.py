"""Export the recorded walkthrough and a short README preview; uploads nothing."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
report = json.loads((ROOT / 'docs/demo-generation-check.json').read_text())
chapters = json.loads((ROOT / 'artifacts/video/chapters.json').read_text())
video = ROOT / 'presentation/Qadam_demo_RU.mp4'
subprocess.run([
    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', str(report.get('leadingSetupTrimSeconds', 0)),
    '-i', str(ROOT / 'artifacts/video/qadam-demo-raw.webm'),
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(video),
], check=True)

# Three four-second excerpts: unavailable stop, delay, return.
starts = [next(c['start'] for c in chapters if term in c['title']) + 1
          for term in ['ПРИШЛИ', 'ПОТЕРЯЛИ', 'ПОРА']]
args = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y']
for start in starts:
    args += ['-ss', str(start), '-t', '4', '-i', str(video)]
filters = ';'.join(f'[{i}:v]fps=6,scale=960:-1:flags=lanczos,setpts=PTS-STARTPTS[v{i}]'
                   for i in range(3))
filters += (';[v0][v1][v2]concat=n=3:v=1:a=0,split[a][b];'
            '[a]palettegen=stats_mode=diff[p];'
            '[b][p]paletteuse=dither=bayer:bayer_scale=3[out]')
subprocess.run(args + ['-filter_complex', filters, '-map', '[out]', '-loop', '0',
                      str(ROOT / 'presentation/assets/demo-preview.gif')], check=True)
print('Exported MP4 and 12-second GIF. No upload performed.')
