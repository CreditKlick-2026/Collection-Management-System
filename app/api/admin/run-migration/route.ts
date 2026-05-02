import { NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function GET() {
  try {
    console.log('Background migration triggered...');
    exec('npx prisma db push --accept-data-loss', (err, stdout, stderr) => {
      if (err) console.error('BG DB Push failed:', err.message);
      else console.log('BG DB Push finished:', stdout);
    });
    return NextResponse.json({ success: true, message: 'Migration started in background. Please wait ~30s and refresh.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
