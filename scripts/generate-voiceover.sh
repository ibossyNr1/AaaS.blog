#!/bin/bash
# Generate TTS voiceover for the AaaS delivery page elevator pitch

set -e

OUTPUT_FILE="apps/platform/public/audio/aaas-pitch.mp3"
mkdir -p apps/platform/public/audio

# SSML with natural pauses and emphasis
cat > /tmp/aaas-pitch-ssml.json << 'SSML_EOF'
{
  "input": {
    "ssml": "<speak><p><s>Agents as a Service.</s></p><break time=\"1s\"/><p><s>Every business runs on context.</s> <s>The problem is <break time=\"300ms\"/> your AI doesn't have any.</s></p><break time=\"800ms\"/><p><s>Your strategy lives in documents nobody reads.</s> <s>Your brand voice lives in one person's head.</s> <s>Your industry knowledge lives in tribal memory.</s> <s>Your competitive edge lives in spreadsheets that expire quarterly.</s></p><break time=\"1s\"/><p><emphasis level=\"strong\"><s>AaaS changes this.</s></emphasis></p><break time=\"800ms\"/><p><s>We take your business DNA <break time=\"200ms\"/> vision, brand, market positioning, competitive landscape, operational knowledge <break time=\"200ms\"/> and encode it into structured context that machines can actually use.</s></p><break time=\"600ms\"/><p><s>Then we deploy autonomous AI agents that don't guess.</s> <emphasis level=\"moderate\"><s>They know.</s></emphasis></p><break time=\"1s\"/><p><emphasis level=\"moderate\"><s>For Founders.</s></emphasis> <break time=\"400ms\"/><s>Stop briefing freelancers.</s> <s>Stop correcting AI outputs.</s> <s>Your agents produce marketing, sales materials, research, and operational workflows that sound like you, think like you, and execute like your best people <break time=\"200ms\"/> at machine scale.</s></p><break time=\"800ms\"/><p><emphasis level=\"moderate\"><s>For Partners and Ambassadors.</s></emphasis> <break time=\"400ms\"/><s>White-label the platform.</s> <s>Co-brand agent workforces for your clients.</s> <s>Every methodology you've built becomes an automated, scalable service.</s> <s>Your expertise, multiplied.</s></p><break time=\"800ms\"/><p><emphasis level=\"moderate\"><s>For Investors.</s></emphasis> <break time=\"400ms\"/><s>This is the infrastructure layer between business strategy and AI execution.</s> <s>Every company needs it.</s> <s>Nobody else is building it.</s> <s>Context is the moat <break time=\"200ms\"/> and we own the encoding.</s></p><break time=\"1s\"/><p><s>The convergence model is simple.</s> <s>Brand.</s> <s>Context.</s> <s>Industry.</s> <s>Strategy.</s> <break time=\"300ms\"/><s>Four dimensions orbiting a single autonomous core.</s> <s>When they converge, AI doesn't just execute <break time=\"200ms\"/> it understands.</s></p><break time=\"800ms\"/><p><s>This is not another AI tool.</s> <emphasis level=\"strong\"><s>This is the operating system for your autonomous workforce.</s></emphasis></p><break time=\"1s\"/><p><emphasis level=\"strong\"><s>Welcome to AaaS.</s></emphasis></p></speak>"
  },
  "voice": {
    "languageCode": "en-US",
    "name": "en-US-Journey-D",
    "ssmlGender": "MALE"
  },
  "audioConfig": {
    "audioEncoding": "MP3",
    "speakingRate": 0.95,
    "pitch": -1.0,
    "effectsProfileId": ["large-home-entertainment-class-device"]
  }
}
SSML_EOF

echo "Generating voiceover with Google Cloud TTS..."
ACCESS_TOKEN=$(gcloud auth print-access-token)

curl -s -X POST \
  "https://texttospeech.googleapis.com/v1/text:synthesize" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/aaas-pitch-ssml.json \
  -o /tmp/aaas-tts-response.json

# Extract audio content and decode
python3 -c "
import json, base64, sys
with open('/tmp/aaas-tts-response.json') as f:
    data = json.load(f)
if 'audioContent' in data:
    audio = base64.b64decode(data['audioContent'])
    with open('$OUTPUT_FILE', 'wb') as out:
        out.write(audio)
    print(f'Audio saved: {len(audio)} bytes -> $OUTPUT_FILE')
else:
    print('Error:', json.dumps(data, indent=2), file=sys.stderr)
    sys.exit(1)
"

echo "Done!"
