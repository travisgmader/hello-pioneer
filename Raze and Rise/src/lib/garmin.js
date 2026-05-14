// Generates a Garmin FIT workout file for downloading to Garmin Connect.
// No external dependencies — encodes the binary FIT format directly.

const GARMIN_EPOCH = 631065600; // Unix seconds for 1989-12-31T00:00:00Z

const CRC_TABLE = [
  0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
  0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
];

function crc16(data, initial = 0) {
  let crc = initial;
  for (const byte of data) {
    let tmp = CRC_TABLE[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc ^= tmp ^ CRC_TABLE[byte & 0xF];
    tmp = CRC_TABLE[crc & 0xF];
    crc = (crc >> 4) & 0x0FFF;
    crc ^= tmp ^ CRC_TABLE[(byte >> 4) & 0xF];
  }
  return crc;
}

class Writer {
  constructor() { this.buf = []; }
  u8(v)  { this.buf.push(v & 0xFF); }
  u16(v) { this.u8(v); this.u8(v >>> 8); }
  u32(v) { this.u16(v); this.u16(v >>> 16); }
  str(s, fixedLen) {
    for (let i = 0; i < fixedLen; i++) {
      this.u8(i < s.length ? s.charCodeAt(i) & 0xFF : 0);
    }
  }
  toUint8Array() { return new Uint8Array(this.buf); }
}

// Write a FIT definition message.
// fields: array of [fieldDefNum, byteSize, baseType]
function writeDef(w, localType, globalNum, fields) {
  w.u8(0x40 | localType); // definition message header
  w.u8(0x00);              // reserved
  w.u8(0x00);              // little-endian architecture
  w.u16(globalNum);
  w.u8(fields.length);
  for (const [num, size, type] of fields) {
    w.u8(num); w.u8(size); w.u8(type);
  }
}

// Maps exercise name to Garmin FIT ExerciseCategory enum value.
function exerciseCategory(name) {
  const n = name.toLowerCase();
  if (/\bbench\b|\bincline press\b|\bdecline press\b|\bchest press\b/.test(n)) return 0;   // bench_press
  if (/\bcalf\b/.test(n)) return 1;                                                         // calf_raise
  if (/\bcrunch\b/.test(n)) return 6;                                                       // crunch
  if (/\bcurl\b/.test(n) && !/leg curl/.test(n)) return 7;                                 // curl
  if (/\bdeadlift\b/.test(n)) return 8;                                                     // deadlift
  if (/\bfl[iy]e?\b/.test(n)) return 9;                                                    // flye
  if (/hip thrust|glute bridge|hip raise/.test(n)) return 10;                              // hip_raise
  if (/hyperextension|back extension/.test(n)) return 13;                                  // hyperextension
  if (/lateral raise/.test(n)) return 14;                                                  // lateral_raise
  if (/leg curl/.test(n)) return 15;                                                       // leg_curl
  if (/leg raise|knee raise|hanging/.test(n)) return 16;                                   // leg_raise
  if (/\blunge\b/.test(n)) return 17;                                                       // lunge
  if (/\bclean\b|\bsnatch\b|\bjerk\b/.test(n)) return 18;                                  // olympic_lift
  if (/\bplank\b/.test(n)) return 19;                                                       // plank
  if (/pull[\s-]?up|chin[\s-]?up/.test(n)) return 21;                                     // pull_up
  if (/push[\s-]?up/.test(n)) return 22;                                                   // push_up
  if (/\brow\b|\bpulldown\b|\bpull.down\b|face pull/.test(n)) return 23;                  // row
  if (/overhead press|shoulder press|military press/.test(n)) return 24;                  // shoulder_press
  if (/\bshrug\b/.test(n)) return 26;                                                       // shrug
  if (/sit[\s-]?up/.test(n)) return 27;                                                    // sit_up
  if (/\bsquat\b|\bgoblet\b|leg press/.test(n)) return 28;                                 // squat
  if (/tricep|skull.?crush|pushdown/.test(n)) return 30;                                  // triceps_extension
  if (/\brun\b|\bsprint\b|\bjog\b/.test(n)) return 32;                                    // run
  return 65535; // unknown
}

export function generateWorkoutFit(dayLabel, exercises) {
  // Expand exercises into individual set steps
  const steps = [];
  for (const ex of exercises) {
    const reps = ex.type === 'run'
      ? 0
      : Math.round(((ex.repLow ?? 8) + (ex.repHigh ?? 12)) / 2);
    const cat = exerciseCategory(ex.name);
    for (let s = 0; s < (ex.sets || 1); s++) {
      steps.push({ name: ex.name, reps, cat, isRun: ex.type === 'run' });
    }
  }

  const body = new Writer();

  // ── file_id (global 0) ────────────────────────────────────────
  writeDef(body, 0, 0, [
    [5, 1, 0x00], // type: enum
    [2, 2, 0x84], // manufacturer: uint16
    [3, 2, 0x84], // product: uint16
    [1, 4, 0x86], // time_created: uint32
  ]);
  body.u8(0x00);
  body.u8(5);       // file type = workout
  body.u16(1);      // manufacturer = Garmin
  body.u16(0xFFFF); // product = unspecified
  body.u32(Math.floor(Date.now() / 1000) - GARMIN_EPOCH);

  // ── workout (global 26) ───────────────────────────────────────
  writeDef(body, 1, 26, [
    [4,  1,  0x00], // sport: enum
    [8,  1,  0x00], // sub_sport: enum
    [6,  2,  0x84], // num_valid_steps: uint16
    [7,  24, 0x07], // wkt_name: string[24]
  ]);
  body.u8(0x01);
  body.u8(4);  // sport = fitness_equipment
  body.u8(20); // sub_sport = strength_training
  body.u16(steps.length);
  body.str(dayLabel.substring(0, 23), 24);

  // ── workout_step (global 27) ──────────────────────────────────
  writeDef(body, 2, 27, [
    [254, 2,  0x84], // message_index: uint16
    [0,   16, 0x07], // wkt_step_name: string[16]
    [2,   1,  0x00], // duration_type: enum
    [3,   4,  0x86], // duration_value: uint32
    [4,   1,  0x00], // target_type: enum
    [5,   4,  0x86], // target_value: uint32
    [11,  2,  0x84], // exercise_category: uint16
  ]);

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    body.u8(0x02);
    body.u16(i);
    body.str(s.name.substring(0, 15), 16);
    body.u8(s.isRun ? 5 : 28); // duration_type: open(5) or repetitions(28)
    body.u32(s.isRun ? 0 : s.reps);
    body.u8(2);  // target_type = open
    body.u32(0);
    body.u16(s.cat);
  }

  const dataBytes = body.toUint8Array();

  // ── File header (14 bytes) ────────────────────────────────────
  const hdrW = new Writer();
  hdrW.u8(14);    // header size
  hdrW.u8(0x20);  // protocol version 2.0
  hdrW.u16(2132); // profile version 21.32
  hdrW.u32(dataBytes.length);
  hdrW.u8(0x2E); hdrW.u8(0x46); hdrW.u8(0x49); hdrW.u8(0x54); // ".FIT"
  const hdr12 = hdrW.toUint8Array(); // CRC covers first 12 bytes
  hdrW.u16(crc16(hdr12));
  const headerBytes = hdrW.toUint8Array(); // 14 bytes

  // File CRC covers header + all message data
  const fileCRC = crc16(dataBytes, crc16(headerBytes));

  const total = headerBytes.length + dataBytes.length + 2;
  const out = new Uint8Array(total);
  out.set(headerBytes, 0);
  out.set(dataBytes, headerBytes.length);
  out[total - 2] = fileCRC & 0xFF;
  out[total - 1] = (fileCRC >>> 8) & 0xFF;

  return out;
}

export function downloadWorkoutFit(dayLabel, exercises) {
  const bytes = generateWorkoutFit(dayLabel, exercises);
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${dayLabel.replace(/[^a-zA-Z0-9_-]/g, '_')}_garmin.fit`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
