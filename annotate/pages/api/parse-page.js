import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);
const PARSER_SCRIPT = resolve(process.cwd(), '..', 'run-parser.sh');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pdfPath, pageNumber, margins } = req.body;
  const marginArg = `${margins.left},${margins.top},${margins.right},${margins.bottom}`;
  const command = `${PARSER_SCRIPT} "${pdfPath}" -p ${pageNumber} -m ${marginArg}`;

  try {
    const { stdout, stderr } = await execAsync(command);
    res.json({ output: stdout, error: stderr });
  } catch (error) {
    console.error('Parser execution error:', error);
    res.status(500).json({ error: error.message });
  }
}
