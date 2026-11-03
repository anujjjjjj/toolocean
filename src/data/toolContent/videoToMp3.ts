import type { ToolPageContent } from "@/types/toolContent";

/**
 * Tier B content for /video-to-mp3.
 *
 * The honest questions are what a browser can decode and what memory costs. The
 * audio is decoded by the browser's own Web Audio engine, so codec support differs
 * per browser, and the whole file sits in RAM while that happens.
 */
export const videoToMp3Content: Partial<ToolPageContent> = {
  tier: "B",

  seo: {
    title: "Video to MP3 – Extract Audio, No Upload, Free",
    description:
      "Video to MP3 with no upload: extract audio from MP4, iPhone MOV, WebM or MKV free online. Choose 128, 192 or 320 kbps, or WAV, and download it from this tab.",
    keywords: [
      "video to mp3",
      "extract audio from video online free",
      "mp4 to mp3 without uploading",
      "mov to mp3",
      "iphone video to mp3",
      "mkv to mp3",
      "webm to mp3",
    ],
  },

  hero: {
    h1: "Video to MP3",
    subtitle:
      "Extract the audio from an MP4, an iPhone MOV, a WebM or an MKV and save it as MP3 or WAV. Conversion happens on your device, so there is no upload to wait for.",
    badges: ["browser-first", "no-uploads", "offline", "free"],
    primaryCta: { label: "Choose a video", action: "upload" },
  },

  intro: {
    heading: "How the audio comes out of the video",
    paragraphs: [
      "No upload is involved: this is MP4 to MP3 without uploading anything, and it works the same way for WebM, MKV and the MOV files an iPhone records. People search for a way to extract audio from video online free, then find sites that send a private recording to a server and make them wait for it twice. Here the file is read by your browser, its sound is decoded by the same engine that plays web audio, and the result is written in this tab.",
      "Encoding runs in a background worker, so the page keeps responding, the percentage counts real frames, and Cancel stops the work at once. The soundtrack is encoded as a single continuous stream, which means there are no clicks or gaps from stitched segments. Your MP3 keeps the original file name, so IMG_1234.MOV becomes IMG_1234.mp3 and still sorts next to the video it came from.",
    ],
  },

  features: [
    {
      icon: "Smartphone",
      title: "Made for iPhone recordings",
      body: "MOV files open whether the picture is H.264 or HEVC, because only the AAC soundtrack needs decoding. The name, IMG_1234 and all, carries over to the MP3.",
    },
    {
      icon: "Settings2",
      title: "Pick the size you want",
      body: "128 kbps suits speech, 192 kbps is the default for most listening, and 320 kbps is for music. WAV is there when an editor needs uncompressed samples.",
    },
    {
      icon: "Gauge",
      title: "A progress bar that means it",
      body: "The stages run from reading to decoding to encoding, with a percentage taken from frames already written rather than a timer guessing how long is left.",
    },
    {
      icon: "CloudOff",
      title: "Nothing to upload",
      body: "A two-hour lecture takes as long as your device needs, not as long as your upload speed needs. Pull the network cable after the page loads and it still works.",
    },
  ],

  howItWorks: [
    {
      title: "Choose a video",
      body: "Drop an MP4, MOV, M4V, WebM or MKV on the box above, or tap to browse. Its name, size and length appear straight away.",
    },
    {
      title: "Pick MP3 or WAV",
      body: "MP3 starts at 192 kbps, with 128 and 320 as alternatives. A note appears if the file is big enough to need care.",
    },
    {
      title: "Listen, then download",
      body: "Press Convert, play the result in the page to check it, and save it under the video's own name.",
    },
  ],

  examples: [
    {
      kind: "file",
      title: "A voice memo filmed on an iPhone",
      description: "A three-minute clip from the Camera app, shared to a laptop as a MOV file.",
      before: { label: "Input", detail: "IMG_1234.MOV, HEVC video with AAC audio" },
      after: { label: "Output", detail: "IMG_1234.mp3, about 4 MB at 192 kbps" },
      settings: "MP3, 192 kbps",
      explanation:
        "Size follows length and bitrate alone: 192 kilobits per second for 180 seconds comes to roughly 4 MB, whether the video was 100 MB or 400 MB. The picture is ignored entirely.",
    },
    {
      kind: "file",
      title: "A recorded lecture for the commute",
      description: "An hour of one person talking, saved from a meeting app as an MP4.",
      before: { label: "Input", detail: "lecture-week-3.mp4, one hour" },
      after: { label: "Output", detail: "lecture-week-3.mp3, about 58 MB at 128 kbps" },
      settings: "MP3, 128 kbps",
      explanation:
        "Speech loses very little at 128 kbps, and the lower bitrate saves about a third of the space compared with the default. An hour is past the 30-minute note, so the tool suggests closing other tabs, and you can carry on regardless.",
    },
  ],

  useCases: [
    {
      icon: "Briefcase",
      audience: "Interviews and podcasts",
      body: "A video call recording is often the only copy of a conversation. Save the sound alone and it becomes easy to edit, send and listen to on a walk.",
    },
    {
      icon: "GraduationCap",
      audience: "Lectures and courses",
      body: "Recorded classes are mostly speech, so the picture adds gigabytes and little else. An audio copy fits on a phone and plays with the screen off.",
    },
    {
      icon: "Sparkles",
      audience: "Your own performances",
      body: "Band practice or a recital filmed on a phone can go straight into a music app or an audio editor without passing through anyone else's server.",
    },
    {
      icon: "Wrench",
      audience: "Editors working on sound",
      body: "Take a WAV of the location audio into a separate editor, clean it up there, and lay it back under the picture later on.",
    },
    {
      icon: "Building2",
      audience: "Recordings that must stay private",
      body: "Client calls, medical appointments and legal interviews often cannot go to a third-party service. This conversion never leaves the device it starts on.",
    },
  ],

  limitations: {
    items: [
      {
        title: "Some audio codecs will not open",
        body:
          "Browsers do not decode Dolby Digital (AC-3) or DTS, which are common in MKV films. FLAC and Opus depend on the browser. The error names the codec when it can, and re-saving as MP4 with AAC audio fixes it.",
      },
      {
        title: "Memory is the real limit",
        body:
          "The video and its decoded audio are both held in RAM. Past 500 MB or 30 minutes a note suggests trimming first or closing tabs, but nothing stops you trying.",
      },
      {
        title: "One soundtrack, no chapters or cover art",
        body:
          "The browser decodes the first audio track only, so an alternate language in an MKV is left behind. Titles, chapters and artwork do not carry over.",
      },
      {
        title: "Surround sound becomes stereo",
        body:
          "A 5.1 mix is folded down to two channels, because MP3 here is mono or stereo. The low-frequency channel is left out of the mix.",
      },
    ],
  },

  faqs: [
    {
      topic: "privacy",
      question: "Is my video uploaded to convert it to MP3?",
      answer:
        "No. Your video never leaves your browser. The file is read, decoded and encoded in this tab, and the only copy made is the one you download. Open your network panel during a conversion and you will see no request carrying the file.",
    },
    {
      question: "How do I convert an iPhone MOV video to MP3?",
      answer:
        "Choose the .MOV here, in Safari on the iPhone or on a computer after AirDrop or a cable transfer, then press Convert. iPhone recordings use AAC audio, which every major browser decodes, even when the picture is HEVC and will not play in Chrome. The MP3 keeps the name, so IMG_1234.MOV becomes IMG_1234.mp3.",
    },
    {
      question: "Why does my MKV file say the audio cannot be decoded?",
      answer:
        "MKV is a container that can hold almost any codec, and films often carry Dolby Digital (AC-3) or DTS, which browsers have no decoder for. AAC works everywhere, Opus usually does, and FLAC depends on the browser. If yours fails, re-save the file as MP4 with AAC audio in a desktop app such as VLC or HandBrake, or try Chrome if you are on another browser.",
    },
    {
      question: "What does \"This video has no audio track\" mean?",
      answer:
        "The file contains a picture and no sound at all, so there is nothing to extract. It is common with screen recordings made with the microphone off, and with clips exported from an editor with audio disabled. Play the original to confirm, then record or export it again with sound turned on.",
    },
    {
      topic: "size",
      question: "Is there a limit on file size or length?",
      answer:
        "There is no fixed limit, because there is no server to enforce one. What runs out is memory: the whole video is loaded, and each minute of stereo audio takes about 21 MB once decoded. Above 500 MB or 30 minutes you will see a warning but can continue. For very long files, cut a shorter part first with [Video Trimmer](/video-trimmer), or close other tabs.",
    },
    {
      question: "Which bitrate should I choose?",
      answer:
        "Use 128 kbps for speech such as lectures and voice notes, 192 kbps for general listening, and 320 kbps for music you care about. Higher settings cannot add detail that the original soundtrack does not have, so 320 kbps from a phone's voice recording only makes a larger file.",
    },
    {
      question: "When should I pick WAV instead of MP3?",
      answer:
        "Pick WAV if the audio is going into an editor and you want to avoid a second round of lossy compression. It is uncompressed 32-bit audio, so a minute takes about 21 MB against about 1.4 MB for a 192 kbps MP3. For listening, sharing or sending by email, MP3 is the better choice.",
    },
    {
      question: "Does converting a video to MP3 reduce audio quality?",
      answer:
        "A little, as any MP3 encode does, because most video soundtracks are already compressed as AAC and MP3 compresses them again. At 192 kbps or above most people will not hear it. WAV skips that second step, and the picture quality of the video makes no difference at all.",
    },
    {
      question: "Can I extract just part of the audio?",
      answer:
        "This tool converts the whole soundtrack. To keep one section, convert first and cut the MP3 with [Audio Cutter](/audio-cutter), which is usually quicker than trimming the video and works on the file you already have.",
    },
    {
      question: "Why is the conversion slow on my phone?",
      answer:
        "Encoding is demanding work done by your own processor, and a phone has less power and memory than a laptop. The page stays usable meanwhile, and Cancel stops it straight away. Keep the tab open and in the foreground, since a phone may pause a background tab to save battery.",
    },
    {
      topic: "offline",
      question: "Does this work offline?",
      answer:
        "Yes. Your browser stores the encoder shortly after the page finishes loading, so flight mode on a train is no obstacle.",
    },
  ],

  related: [
    { name: "Video Trimmer", path: "/video-trimmer", description: "Cut a long recording down before you convert it." },
    { name: "Audio Cutter", path: "/audio-cutter", description: "Trim the MP3 to the part you want to keep." },
    { name: "Video to GIF", path: "/video-to-gif", description: "Turn the same clip into a short looping GIF." },
    { name: "Audio Merge", path: "/audio-merge", description: "Join several extracted clips into one file." },
    { name: "Video Metadata Viewer", path: "/video-metadata", description: "Check a file's length and dimensions first." },
  ],

  headings: {
    features: { heading: "What you get" },
    howItWorks: { heading: "How to convert a video to MP3" },
    examples: {
      heading: "Two recordings, converted",
      lede: "A short iPhone clip, and an hour of speech at a lower bitrate.",
    },
    useCases: { heading: "When you only need the sound" },
    faq: { heading: "Video to MP3: common questions" },
    related: { heading: "Other video and audio tools" },
    limitations: {
      heading: "Good to know",
      lede: "What a browser can decode, and what memory allows.",
    },
  },
};
