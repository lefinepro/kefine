import qrcode from 'qrcode-generator';

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface QrMatrix {
  /** Number of modules per side (not counting the quiet zone). */
  count: number;
  /** Width of the SVG view box (count + quiet zone on both sides). */
  size: number;
  /** Quiet-zone padding (in module units) applied around the matrix. */
  margin: number;
  /** SVG path data for the data modules (everything except the finder eyes). */
  dataPath: string;
  /** SVG path data for the three finder-pattern eyes. */
  finderPath: string;
}

/**
 * Detects whether a module belongs to one of the three finder-pattern "eyes".
 * They live in the top-left, top-right and bottom-left 7×7 corners.
 */
function isFinderModule(count: number, row: number, col: number): boolean {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= count - 7;
  const inBottomLeft = row >= count - 7 && col < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

/**
 * Builds an SVG-friendly description of a QR code for a given payload.
 *
 * The matrix is split into two paths so the caller can paint the data modules
 * and the finder eyes independently (e.g. data in `currentColor` for theme
 * adaptation and the eyes in a Lefine accent gradient). The background is left
 * to the caller, so the code can blend with any surface.
 */
export function buildQrMatrix(
  value: string,
  errorCorrection: QrErrorCorrection = 'M',
  margin = 4
): QrMatrix {
  const trimmed = value.trim();
  const qr = qrcode(0, errorCorrection);
  // Fall back to a single space so an empty payload still yields a valid matrix.
  qr.addData(trimmed.length > 0 ? trimmed : ' ');
  qr.make();

  const count = qr.getModuleCount();
  let dataPath = '';
  let finderPath = '';

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) {
        continue;
      }

      const x = col + margin;
      const y = row + margin;
      const segment = `M${x} ${y}h1v1h-1z`;
      if (isFinderModule(count, row, col)) {
        finderPath += segment;
      } else {
        dataPath += segment;
      }
    }
  }

  return {
    count,
    size: count + margin * 2,
    margin,
    dataPath,
    finderPath
  };
}
