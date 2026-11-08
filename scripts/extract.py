import re

def main():
    file_path = 'data/directive/day-002/006.phase-three.jules.md'
    with open(file_path, 'r') as f:
        content = f.read()

    # Regex to match file paths and their corresponding typescript blocks
    pattern = r'### \d+\.\s+`(.*?)`\n\n```typescript\n(.*?)```'
    matches = re.finditer(pattern, content, re.DOTALL)

    for match in matches:
        target_path = match.group(1)
        code = match.group(2)
        print(f"Extracting {target_path}...")

        if "manifest.schema.ts" in target_path or "02.topology-menu.buzz.ts" in target_path or "topology.contracts.test.ts" in target_path:
            with open(target_path, 'w') as out:
                out.write(code)
        else:
            with open(target_path, 'a') as out:
                out.write("\n")
                out.write(code)

if __name__ == '__main__':
    main()
