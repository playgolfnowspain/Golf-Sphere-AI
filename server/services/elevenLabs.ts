import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

// Default voice IDs for the two hosts
// These are ElevenLabs pre-made voices; can be customized via env vars
const VOICE_ALEX = process.env.ELEVENLABS_VOICE_ALEX || "21m00Tcm4TlvDq8ikWAM"; // Rachel (pre-made)
const VOICE_SAM = process.env.ELEVENLABS_VOICE_SAM || "ErXwobaYiN019PkySvjV"; // Antoni (pre-made)

interface DialogueLine {
  speaker: "Alex" | "Sam";
  text: string;
}

function parseScript(script: string): DialogueLine[] {
  const lines: DialogueLine[] = [];
  const regex = /^(Alex|Sam):\s*(.+)$/gim;
  let match;

  while ((match = regex.exec(script)) !== null) {
    const speaker = match[1] as "Alex" | "Sam";
    const text = match[2].trim();
    if (text) {
      lines.push({ speaker, text });
    }
  }

  return lines;
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function generateSpeechSegment(
  client: ElevenLabsClient,
  text: string,
  voiceId: string
): Promise<Buffer> {
  const audioStream = await client.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
  });

  // Handle the response as a ReadableStream
  return streamToBuffer(audioStream as unknown as ReadableStream<Uint8Array>);
}

export async function generatePodcastAudio(script: string): Promise<string | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn("[elevenlabs] No API key configured. Skipping audio generation.");
    return null;
  }

  const client = new ElevenLabsClient({ apiKey });
  const dialogueLines = parseScript(script);

  if (dialogueLines.length === 0) {
    console.warn("[elevenlabs] No dialogue lines parsed from script.");
    return null;
  }

  console.log(`[elevenlabs] Generating audio for ${dialogueLines.length} dialogue lines...`);

  const audioSegments: Buffer[] = [];

  for (const line of dialogueLines) {
    const voiceId = line.speaker === "Alex" ? VOICE_ALEX : VOICE_SAM;
    try {
      const segment = await generateSpeechSegment(client, line.text, voiceId);
      audioSegments.push(segment);
      // Add a small pause between speakers (silence would need to be generated,
      // but for simplicity we'll just concatenate)
    } catch (error) {
      console.error(`[elevenlabs] Failed to generate segment for ${line.speaker}:`, error);
      // Continue with other segments
    }
  }

  if (audioSegments.length === 0) {
    console.error("[elevenlabs] No audio segments generated.");
    return null;
  }

  // Concatenate all MP3 segments
  // Note: Simple concatenation works for MP3 but may have minor artifacts at boundaries
  const combinedAudio = Buffer.concat(audioSegments);

  // Return as base64 data URL
  const base64Audio = combinedAudio.toString("base64");
  const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

  console.log(`[elevenlabs] Generated ${(combinedAudio.length / 1024 / 1024).toFixed(2)} MB of audio.`);

  return dataUrl;
}

// Estimate duration based on text length (rough approximation)
export function estimateDuration(script: string): number {
  // Average speaking rate: ~150 words per minute
  const words = script.split(/\s+/).length;
  const minutes = words / 150;
  return Math.round(minutes * 60); // Return seconds
}
