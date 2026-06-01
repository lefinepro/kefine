/**
 * Minimal, dependency-free QR Code generator.
 *
 * This is a focused TypeScript port of Nayuki's "QR Code generator library"
 * (MIT License, https://www.nayuki.io/page/qr-code-generator-library). Only the
 * byte-mode encoder is kept because the proxy configuration widget only needs to
 * encode short UTF-8 connection strings/URLs.
 *
 * The generator returns a square boolean matrix (`true` === dark module) so the
 * caller can render it however it likes — the Lefine widget renders it as themed
 * SVG so the code can adapt to light/dark backgrounds and brand colors instead of
 * being locked to a white background.
 */

export type QrErrorCorrectionLevel = 'low' | 'medium' | 'quartile' | 'high';

export interface QrMatrix {
  /** Number of modules per side (always odd, between 21 and 177). */
  size: number;
  /** Row-major matrix of modules. `true` means the module is dark. */
  modules: boolean[][];
  /** Quiet-zone independent version (1-40). */
  version: number;
}

interface EccEntry {
  ordinal: number;
  formatBits: number;
}

const ECC: Record<QrErrorCorrectionLevel, EccEntry> = {
  low: { ordinal: 0, formatBits: 1 },
  medium: { ordinal: 1, formatBits: 0 },
  quartile: { ordinal: 2, formatBits: 3 },
  high: { ordinal: 3, formatBits: 2 }
};

const MIN_VERSION = 1;
const MAX_VERSION = 40;
const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  // Version: (note: index 0 is unused/padding)
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Low
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28], // Medium
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30], // Quartile
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30] // High
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25], // Low
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49], // Medium
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68], // Quartile
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81] // High
];

class BitBuffer {
  private readonly bits: number[] = [];

  get length(): number {
    return this.bits.length;
  }

  appendBits(value: number, length: number): void {
    if (length < 0 || length > 31 || value >>> length !== 0) {
      throw new RangeError('Value out of range for the requested bit length');
    }
    for (let index = length - 1; index >= 0; index--) {
      this.bits.push((value >>> index) & 1);
    }
  }

  getBit(index: number): number {
    return this.bits[index] ?? 0;
  }
}

function toUtf8Bytes(text: string): number[] {
  const encoded = encodeURIComponent(text);
  const bytes: number[] = [];
  for (let index = 0; index < encoded.length; index++) {
    if (encoded[index] === '%') {
      bytes.push(parseInt(encoded.substring(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(encoded.charCodeAt(index));
    }
  }
  return bytes;
}

function getNumDataCodewords(version: number, ecc: EccEntry): number {
  return Math.floor(getNumRawDataModules(version) / 8) - getTotalEccCodewords(version, ecc);
}

function getTotalEccCodewords(version: number, ecc: EccEntry): number {
  return ECC_CODEWORDS_PER_BLOCK[ecc.ordinal][version] * NUM_ERROR_CORRECTION_BLOCKS[ecc.ordinal][version];
}

function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) {
      result -= 36;
    }
  }
  return result;
}

function reedSolomonComputeDivisor(degree: number): number[] {
  const result: number[] = Array.from<number>({ length: degree }).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let index = 0; index < degree; index++) {
    for (let position = 0; position < result.length; position++) {
      result[position] = reedSolomonMultiply(result[position], root);
      if (position + 1 < result.length) {
        result[position] ^= result[position + 1];
      }
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
  const result: number[] = divisor.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() ?? 0);
    result.push(0);
    for (let index = 0; index < result.length; index++) {
      result[index] ^= reedSolomonMultiply(divisor[index], factor);
    }
  }
  return result;
}

function reedSolomonMultiply(x: number, y: number): number {
  let result = 0;
  for (let index = 7; index >= 0; index--) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((y >>> index) & 1) * x;
  }
  return result & 0xff;
}

function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) {
    return [];
  }
  const numAlign = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result: number[] = [6];
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

class Encoder {
  readonly size: number;
  private readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  constructor(
    readonly version: number,
    private readonly ecc: EccEntry,
    dataCodewords: number[],
    mask: number
  ) {
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => Array.from<boolean>({ length: this.size }).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => Array.from<boolean>({ length: this.size }).fill(false));

    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);

    const appliedMask = mask < 0 ? this.chooseBestMask() : mask;
    this.applyMask(appliedMask);
    this.drawFormatBits(appliedMask);
  }

  getMatrix(): boolean[][] {
    return this.modules.map((row) => row.slice());
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    for (let index = 0; index < this.size; index++) {
      this.setFunctionModule(6, index, index % 2 === 0);
      this.setFunctionModule(index, 6, index % 2 === 0);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const alignPositions = getAlignmentPatternPositions(this.version);
    const numAlign = alignPositions.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0)) {
          continue;
        }
        this.drawAlignmentPattern(alignPositions[i], alignPositions[j]);
      }
    }

    this.drawFormatBits(0);
    this.drawVersion();
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private drawFormatBits(mask: number): void {
    const data = (this.ecc.formatBits << 3) | mask;
    let rem = data;
    for (let index = 0; index < 10; index++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let index = 0; index <= 5; index++) {
      this.setFunctionModule(8, index, ((bits >>> index) & 1) !== 0);
    }
    this.setFunctionModule(8, 7, ((bits >>> 6) & 1) !== 0);
    this.setFunctionModule(8, 8, ((bits >>> 7) & 1) !== 0);
    this.setFunctionModule(7, 8, ((bits >>> 8) & 1) !== 0);
    for (let index = 9; index < 15; index++) {
      this.setFunctionModule(14 - index, 8, ((bits >>> index) & 1) !== 0);
    }

    for (let index = 0; index < 8; index++) {
      this.setFunctionModule(this.size - 1 - index, 8, ((bits >>> index) & 1) !== 0);
    }
    for (let index = 8; index < 15; index++) {
      this.setFunctionModule(8, this.size - 15 + index, ((bits >>> index) & 1) !== 0);
    }
    this.setFunctionModule(8, this.size - 8, true);
  }

  private drawVersion(): void {
    if (this.version < 7) {
      return;
    }
    let rem = this.version;
    for (let index = 0; index < 12; index++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const bits = (this.version << 12) | rem;

    for (let index = 0; index < 18; index++) {
      const isDark = ((bits >>> index) & 1) !== 0;
      const a = this.size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      this.setFunctionModule(a, b, isDark);
      this.setFunctionModule(b, a, isDark);
    }
  }

  private addEccAndInterleave(data: number[]): number[] {
    const version = this.version;
    const ecc = this.ecc;
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[ecc.ordinal][version];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ecc.ordinal][version];
    const rawCodewords = Math.floor(getNumRawDataModules(version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: number[][] = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    let offset = 0;
    for (let i = 0; i < numBlocks; i++) {
      const datLen = shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1);
      const dat = data.slice(offset, offset + datLen);
      offset += datLen;
      const eccBytes = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) {
        dat.push(0);
      }
      blocks.push(dat.concat(eccBytes));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) {
          result.push(blocks[j][i]);
        }
      }
    }
    return result;
  }

  private drawCodewords(data: number[]): void {
    let index = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) {
        right = 5;
      }
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && index < data.length * 8) {
            this.modules[y][x] = ((data[index >>> 3] >>> (7 - (index & 7))) & 1) !== 0;
            index++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.isFunction[y][x]) {
          continue;
        }
        let invert = false;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: throw new RangeError('Mask value out of range');
        }
        if (invert) {
          this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  private chooseBestMask(): number {
    let bestMask = 0;
    let minPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      this.applyMask(mask);
      this.drawFormatBits(mask);
      const penalty = this.computePenalty();
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestMask = mask;
      }
      this.applyMask(mask);
    }
    return bestMask;
  }

  private computePenalty(): number {
    let result = 0;
    const size = this.size;
    const modules = this.modules;

    for (let y = 0; y < size; y++) {
      let runColor = false;
      let runLength = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < size; x++) {
        if (modules[y][x] === runColor) {
          runLength++;
          if (runLength === 5) {
            result += PENALTY_N1;
          } else if (runLength > 5) {
            result++;
          }
        } else {
          this.finderPenaltyAddHistory(runLength, runHistory);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          }
          runColor = modules[y][x];
          runLength = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runLength, runHistory) * PENALTY_N3;
    }

    for (let x = 0; x < size; x++) {
      let runColor = false;
      let runLength = 0;
      const runHistory = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < size; y++) {
        if (modules[y][x] === runColor) {
          runLength++;
          if (runLength === 5) {
            result += PENALTY_N1;
          } else if (runLength > 5) {
            result++;
          }
        } else {
          this.finderPenaltyAddHistory(runLength, runHistory);
          if (!runColor) {
            result += this.finderPenaltyCountPatterns(runHistory) * PENALTY_N3;
          }
          runColor = modules[y][x];
          runLength = 1;
        }
      }
      result += this.finderPenaltyTerminateAndCount(runColor, runLength, runHistory) * PENALTY_N3;
    }

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const color = modules[y][x];
        if (color === modules[y][x + 1] && color === modules[y + 1][x] && color === modules[y + 1][x + 1]) {
          result += PENALTY_N2;
        }
      }
    }

    let dark = 0;
    for (const row of modules) {
      for (const cell of row) {
        if (cell) {
          dark++;
        }
      }
    }
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;
    return result;
  }

  private finderPenaltyCountPatterns(runHistory: number[]): number {
    const n = runHistory[1];
    const core = n > 0 && runHistory[2] === n && runHistory[3] === n * 3 && runHistory[4] === n && runHistory[5] === n;
    return (
      (core && runHistory[0] >= n * 4 && runHistory[6] >= n ? 1 : 0) +
      (core && runHistory[6] >= n * 4 && runHistory[0] >= n ? 1 : 0)
    );
  }

  private finderPenaltyTerminateAndCount(currentRunColor: boolean, currentRunLengthInput: number, runHistory: number[]): number {
    let currentRunLength = currentRunLengthInput;
    if (currentRunColor) {
      this.finderPenaltyAddHistory(currentRunLength, runHistory);
      currentRunLength = 0;
    }
    currentRunLength += this.size;
    this.finderPenaltyAddHistory(currentRunLength, runHistory);
    return this.finderPenaltyCountPatterns(runHistory);
  }

  private finderPenaltyAddHistory(currentRunLength: number, runHistory: number[]): void {
    if (runHistory[0] === 0) {
      currentRunLength += this.size;
    }
    runHistory.pop();
    runHistory.unshift(currentRunLength);
  }
}

function encodeDataBits(bytes: number[], version: number, dataCapacityBits: number): number[] {
  const bb = new BitBuffer();
  bb.appendBits(0x4, 4); // Byte mode indicator
  const charCountBits = version <= 9 ? 8 : 16;
  bb.appendBits(bytes.length, charCountBits);
  for (const byte of bytes) {
    bb.appendBits(byte, 8);
  }

  bb.appendBits(0, Math.min(4, dataCapacityBits - bb.length));
  bb.appendBits(0, (8 - (bb.length % 8)) % 8);

  const dataCodewords: number[] = [];
  for (let index = 0; index < bb.length; index += 8) {
    let codeword = 0;
    for (let bit = 0; bit < 8; bit++) {
      codeword = (codeword << 1) | bb.getBit(index + bit);
    }
    dataCodewords.push(codeword);
  }

  for (let padByte = 0xec; dataCodewords.length * 8 < dataCapacityBits; padByte ^= 0xec ^ 0x11) {
    dataCodewords.push(padByte);
  }
  return dataCodewords;
}

/**
 * Encodes UTF-8 text into a square QR Code matrix. Throws if the text is too long
 * for the largest QR version at the requested error-correction level.
 */
export function createQrMatrix(
  text: string,
  options: { errorCorrectionLevel?: QrErrorCorrectionLevel } = {}
): QrMatrix {
  const ecc = ECC[options.errorCorrectionLevel ?? 'medium'];
  const bytes = toUtf8Bytes(text);

  let version = MIN_VERSION;
  for (; ; version++) {
    if (version > MAX_VERSION) {
      throw new RangeError('Data too long to encode in a QR Code');
    }
    const dataCapacityBits = getNumDataCodewords(version, ecc) * 8;
    const charCountBits = version <= 9 ? 8 : 16;
    const usedBits = 4 + charCountBits + bytes.length * 8;
    if (usedBits <= dataCapacityBits) {
      break;
    }
  }

  const dataCapacityBits = getNumDataCodewords(version, ecc) * 8;
  const dataCodewords = encodeDataBits(bytes, version, dataCapacityBits);
  const encoder = new Encoder(version, ecc, dataCodewords, -1);

  return {
    size: encoder.size,
    version,
    modules: encoder.getMatrix()
  };
}

/**
 * Builds an SVG `<path d="...">` string for the dark modules of a QR matrix.
 * Each dark module becomes a unit square placed on an integer grid, so the
 * caller can scale it with the SVG `viewBox` and color it with `fill` — this is
 * what lets the Lefine widget render the code in theme-aware brand colors on a
 * transparent (non-white) background.
 */
export function qrMatrixToSvgPath(matrix: QrMatrix): string {
  const parts: string[] = [];
  for (let y = 0; y < matrix.size; y++) {
    for (let x = 0; x < matrix.size; x++) {
      if (matrix.modules[y][x]) {
        parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
  }
  return parts.join('');
}
