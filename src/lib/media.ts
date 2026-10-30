/**
 * All imagery and footage is free-to-use Pexels content, linked from the Pexels CDN. For a real
 * deployment, host your own copies (e.g. on Cloudinary) instead of hot-linking.
 */
export const photo = (id: number, width = 1200) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`

export interface Clip {
  id: number
  fps: number
}

/** Pexels serves each clip in several sizes; the 4K originals can be 20-35 MB, so never use those. */
export const clipUrl = ({ id, fps }: Clip, quality: 'hd_1920_1080' | 'sd_960_540') =>
  `https://videos.pexels.com/video-files/${id}/${id}-${quality}_${fps}fps.mp4`

/** Phones and data-saver users get the 540p files. */
export function prefersSmallVideo() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  return window.matchMedia('(max-width: 767px)').matches || Boolean(saveData)
}
