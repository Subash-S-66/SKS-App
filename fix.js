const fs = require('fs');
let code = fs.readFileSync('app/(dashboard)/projects/new/page.tsx', 'utf8');

// The issue is an extra </Select> tag at the end. We'll find it with a simpler regex.
code = code.replace(/<\/Select>\n\s*<\/Select>/g, '</Select>');

// Let's also just manually fix the exact snippet:
const badSnippet = `                    </Select>
                    {bdes.length === 0 && (
                      <div className="mt-2 text-sm text-yellow-500">
                        No BDEs available. <Link href="/users" className="underline">Create one here</Link>.
                      </div>
                    )}
                    </Select>`;

const goodSnippet = `                    </Select>
                    {bdes.length === 0 && (
                      <div className="mt-2 text-sm text-yellow-500">
                        No BDEs available. <Link href="/users" className="underline">Create one here</Link>.
                      </div>
                    )}`;

code = code.replace(badSnippet, goodSnippet);

fs.writeFileSync('app/(dashboard)/projects/new/page.tsx', code);
