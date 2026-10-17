import re
import sys

pattern = re.compile(r'class="[^"]*(px-|py-|grid-cols|bg-\[)')
files = ['public/download.html', 'public/software.html', 'public/software-center.js', 'public/software.js']
found = 0

for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        for idx, line in enumerate(fh, 1):
            if pattern.search(line):
                print(f'{f}:{idx}: {line.strip()}')
                found += 1

print(f'Total matches: {found}')
if found > 0:
    sys.exit(1)
print('ALL CLEAN: Zero Tailwind classes in download.html, software.html, software-center.js, software.js!')
