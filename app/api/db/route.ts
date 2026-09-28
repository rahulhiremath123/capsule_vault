import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'database.json');

// Initialize local DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ vaults: {}, logs: {} }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const capsuleId = searchParams.get('capsuleId');
    const type = searchParams.get('type'); // 'vault' or 'log'
    const check = searchParams.get('check'); // if we just want to verify it exists
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    if (check) {
      const exists = !!data.vaults[check] || !!data.logs[check];
      return NextResponse.json({ exists });
    }
    
    if (!capsuleId || !type) return NextResponse.json(data);
    
    if (type === 'vault') {
      return NextResponse.json(data.vaults[capsuleId] || []);
    }
    if (type === 'log') {
      return NextResponse.json(data.logs[capsuleId] || []);
    }
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read DB' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { capsuleId, type, entry } = await req.json();
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    
    if (type === 'vault') {
      if (!data.vaults[capsuleId]) data.vaults[capsuleId] = [];
      
      const existingIndex = data.vaults[capsuleId].findIndex((e: any) => e.id === entry.id);
      if (existingIndex > -1) {
         data.vaults[capsuleId][existingIndex] = entry; // Update
      } else {
         data.vaults[capsuleId].push(entry); // Create
      }
    } else if (type === 'log') {
      if (!data.logs[capsuleId]) data.logs[capsuleId] = [];
      data.logs[capsuleId].push(entry);
    } else if (type === 'create_capsule') {
      // Just initialize the bucket
      if (!data.vaults[capsuleId]) data.vaults[capsuleId] = [];
      if (!data.logs[capsuleId]) data.logs[capsuleId] = [];
    }
    
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to write to DB' }, { status: 500 });
  }
}
