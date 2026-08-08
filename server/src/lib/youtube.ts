import { YoutubeTranscript } from "youtube-transcript";
import { ValidationError } from "../types/app-error.js";

/**
 * https://www.youtube.com/watch?v=dQw4w9WgXcQ --> videoId: dQw4w9WgXcQ

  YouTube Video ID is the 11-character identifier after v=, youtu.be/, embed/, or shorts/.
  (?: ... | ... | ... ) matches one of several URL formats without capturing that part.
  ([\w-]{11}) is the capturing group that extracts exactly 11 valid ID characters.
  ?.[1] safely gets the captured ID; if there is no match, it gives undefined instead of throwing.
  ?? provides the fallback: try normal YouTube URLs first, then try the Shorts URL.
*/

export async function fetchYoutubeTranscript(url: string) {
    const videoId =
        url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
        )?.[1] ?? url.match(/youtube\.com\/shorts\/([\w-]{11})/)?.[1];

    if (!videoId) {
        throw new ValidationError("Enter a valid YouTube URL");
    }

    try {
        const segments = await YoutubeTranscript.fetchTranscript(videoId);
        const content = segments.map((segment) => segment.text).join(" ").trim();

        if (!content) {
            throw new ValidationError(
                "No transcript found for this video",
            );
        }

        return { videoId, content };
    } catch {
        throw new ValidationError(
            "Could not fetch transcript. The video may not have captions.",
        );
    }
}