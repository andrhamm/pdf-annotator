import { exec } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execAsync = promisify(exec);
const PARSER_SCRIPT = resolve(process.cwd(), '..', 'run-parser.sh');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pageNumber, margins } = req.body;
    const pdfPath = req.body.pdfPath || process.env.PDF_PATH; // Allow environment override
    
    const marginArg = `${margins.left},${margins.top},${margins.right},${margins.bottom}`;
    const command = `${PARSER_SCRIPT} "${pdfPath}" -p ${pageNumber} -m ${marginArg}`;
    
    const { stdout, stderr } = await execAsync(command);
    
    res.json({
      success: true,
      output: stdout,
      error: stderr || null
    });
  } catch (error) {
    console.error('Parser error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
