import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();
    
    if (!name || !email || !message) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Process the message (log to console / mock ingestion)
    console.log(`[Contact Submission] Name: ${name}, Email: ${email}, Phone: ${phone || 'N/A'}`);
    console.log(`[Message]: ${message}`);

    return NextResponse.json({ success: true, message: 'Message received successfully' });
  } catch (error) {
    console.error('Error in contact endpoint:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
