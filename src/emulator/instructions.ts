import { relative } from "path";
import { Word } from "./memory";

export enum CommandType {
  adc,
  and,
  asl,
  bcc,
  bcs,
  beq,
  bit,
  bmi,
  bne,
  bpl,
  bvc,
  bvs,
  clc,
  cld,
  cli,
  clv,
  brk,
  cmp,
  cpx,
  cpy,
  dec,
  dex,
  dey,
  eor,
  inc,
  inx,
  iny,
  jmp,
  jsr,
  lda,
  ldx,
  ldy,
  lsr,
  nop,
  ora,
  pha,
  php,
  pla,
  plp,
  rol,
  ror,
  rti,
  rts,
  sbc,
  sec,
  sed,
  sei,
  sta,
  stx,
  sty,
  tax,
  tay,
  tsx,
  txa,
  txs,
  tya,
}

export enum AddressingMode {
  implied,
  immediate,
  absolute,
  absoluteX,
  absoluteY,
  indirect,
  indirectX,
  indirectY,
  zeroPage,
  zeroPageX,
  zeroPageY,
  accumulator,
  relative,
}

export interface Command {
  commandType: CommandType;
  addressingMode: AddressingMode;
}

export interface Instruction {
  command: Command;
  trailingBytes: Word[];
}

export function getArgumentLength(addressingMode: AddressingMode) {
  switch (addressingMode) {
    case AddressingMode.implied:
    case AddressingMode.accumulator: {
      return 0;
    }
    case AddressingMode.immediate:
    case AddressingMode.relative:
    case AddressingMode.zeroPage:
    case AddressingMode.zeroPageX:
    case AddressingMode.zeroPageY:
    case AddressingMode.indirectX:
    case AddressingMode.indirectY: {
      return 1;
    }
    case AddressingMode.indirect:
    case AddressingMode.absolute:
    case AddressingMode.absoluteX:
    case AddressingMode.absoluteY: {
      return 2;
    }
  }
}

/*
For poor souls who are trying to make sense of it:
  There ARE actually rules for opcodes, like indirect ZP being always +0x10 from ZP
  but they are inconsistent (Mentioned above zero page rule actually works same for ZPX and ZPY)
  which depends on specific opcodes. Finding and implementing these rules will be slower than
  just hardcoding 1 to 1 mapping of all opcodes (Not to mention that it will be a spaghetti monster).
  Well, that said i have an enormous switch-case statement to write...
*/
/**
 * Converts a byte to a command.
 *
 */
export function byteToCmd(data: Word): Command | undefined {
  return instructionSet[data.value];
}

export function cmdToByte(cmd: Command): Word | undefined {
  return new Word(bytesByCommand[cmd.commandType][cmd.addressingMode]);
}

export function getAddressingModes(cmdType: CommandType) {
  return bytesByCommand[cmdType];
}

const instructionSet: Record<number, Command | undefined> = {
  // * ADC
  0x69: {
    commandType: CommandType.adc,
    addressingMode: AddressingMode.immediate,
  },
  0x6d: {
    commandType: CommandType.adc,
    addressingMode: AddressingMode.absolute,
  },
  0x65: {
    commandType: CommandType.adc,
    addressingMode: AddressingMode.zeroPage,
  },
  0x75: {
    commandType: CommandType.adc,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x7d: {
    commandType: CommandType.adc,
    addressingMode: AddressingMode.absoluteX,
  },
  0x79: {
    commandType: CommandType.adc,
    addressingMode: AddressingMode.absoluteY,
  },
  // * AND
  0x29: {
    commandType: CommandType.and,
    addressingMode: AddressingMode.immediate,
  },
  0x2d: {
    commandType: CommandType.and,
    addressingMode: AddressingMode.absolute,
  },
  0x25: {
    commandType: CommandType.and,
    addressingMode: AddressingMode.zeroPage,
  },
  0x35: {
    commandType: CommandType.and,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x3d: {
    commandType: CommandType.and,
    addressingMode: AddressingMode.absoluteX,
  },
  0x39: {
    commandType: CommandType.and,
    addressingMode: AddressingMode.absoluteY,
  },
  // * BRK
  0x00: {
    commandType: CommandType.brk,
    addressingMode: AddressingMode.implied,
  },
  // * ASL
  0x0e: {
    commandType: CommandType.asl,
    addressingMode: AddressingMode.absolute,
  },
  0x06: {
    commandType: CommandType.asl,
    addressingMode: AddressingMode.zeroPage,
  },
  0x0a: {
    commandType: CommandType.asl,
    addressingMode: AddressingMode.accumulator,
  },
  0x16: {
    commandType: CommandType.asl,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x1e: {
    commandType: CommandType.asl,
    addressingMode: AddressingMode.absoluteX,
  },
  // * Branch Instructions
  0x90: {
    commandType: CommandType.bcc,
    addressingMode: AddressingMode.relative,
  },
  0xb0: {
    commandType: CommandType.bcs,
    addressingMode: AddressingMode.relative,
  },
  0xf0: {
    commandType: CommandType.beq,
    addressingMode: AddressingMode.relative,
  },
  0x2f: {
    commandType: CommandType.bmi,
    addressingMode: AddressingMode.relative,
  },
  0xd0: {
    commandType: CommandType.bne,
    addressingMode: AddressingMode.relative,
  },
  0x10: {
    commandType: CommandType.bpl,
    addressingMode: AddressingMode.relative,
  },
  0x50: {
    commandType: CommandType.bvc,
    addressingMode: AddressingMode.relative,
  },
  0x70: {
    commandType: CommandType.bvs,
    addressingMode: AddressingMode.relative,
  },
  // * BIT
  0x2c: {
    commandType: CommandType.bit,
    addressingMode: AddressingMode.absolute,
  },
  0x24: {
    commandType: CommandType.bit,
    addressingMode: AddressingMode.zeroPage,
  },
  // * Clear Flags
  0x18: {
    commandType: CommandType.clc,
    addressingMode: AddressingMode.implied,
  },
  0xd8: {
    commandType: CommandType.cld,
    addressingMode: AddressingMode.implied,
  },
  0x58: {
    commandType: CommandType.cli,
    addressingMode: AddressingMode.implied,
  },
  0xb8: {
    commandType: CommandType.clv,
    addressingMode: AddressingMode.implied,
  },
  // * CMP
  0xc9: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.immediate,
  },
  0xcd: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.absolute,
  },
  0xc5: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.zeroPage,
  },
  0xc1: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.indirectX,
  },
  0xd1: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.indirectY,
  },
  0xd5: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.zeroPageX,
  },
  0xdd: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.absoluteX,
  },
  0xd9: {
    commandType: CommandType.cmp,
    addressingMode: AddressingMode.absoluteY,
  },
  // * CPX
  0xe0: {
    commandType: CommandType.cpx,
    addressingMode: AddressingMode.immediate,
  },
  0xec: {
    commandType: CommandType.cpx,
    addressingMode: AddressingMode.absolute,
  },
  0xe4: {
    commandType: CommandType.cpx,
    addressingMode: AddressingMode.zeroPage,
  },
  // * CPY
  0xc0: {
    commandType: CommandType.cpy,
    addressingMode: AddressingMode.immediate,
  },
  0xcc: {
    commandType: CommandType.cpy,
    addressingMode: AddressingMode.absolute,
  },
  0xc4: {
    commandType: CommandType.cpy,
    addressingMode: AddressingMode.zeroPage,
  },
  // * DEC
  0xce: {
    commandType: CommandType.dec,
    addressingMode: AddressingMode.absolute,
  },
  0xc6: {
    commandType: CommandType.dec,
    addressingMode: AddressingMode.zeroPage,
  },
  0xd6: {
    commandType: CommandType.dec,
    addressingMode: AddressingMode.zeroPageX,
  },
  0xde: {
    commandType: CommandType.dec,
    addressingMode: AddressingMode.absoluteX,
  },
  // * DEX
  0xca: {
    commandType: CommandType.dex,
    addressingMode: AddressingMode.implied,
  },
  // * DEY
  0x88: {
    commandType: CommandType.dey,
    addressingMode: AddressingMode.implied,
  },
  // * EOR
  0x49: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.immediate,
  },
  0x4d: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.absolute,
  },
  0x45: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.zeroPage,
  },
  0x41: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.indirectX,
  },
  0x51: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.indirectY,
  },
  0x55: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x5d: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.absoluteX,
  },
  0x59: {
    commandType: CommandType.eor,
    addressingMode: AddressingMode.absoluteY,
  },
  // * INC
  0xee: {
    commandType: CommandType.inc,
    addressingMode: AddressingMode.absolute,
  },
  0xe6: {
    commandType: CommandType.inc,
    addressingMode: AddressingMode.zeroPage,
  },
  0xf6: {
    commandType: CommandType.inc,
    addressingMode: AddressingMode.zeroPageX,
  },
  0xfe: {
    commandType: CommandType.inc,
    addressingMode: AddressingMode.absoluteX,
  },
  // * INX
  0xe8: {
    commandType: CommandType.inx,
    addressingMode: AddressingMode.implied,
  },
  // * INY
  0xc8: {
    commandType: CommandType.iny,
    addressingMode: AddressingMode.implied,
  },
  // * JMP
  0x4c: {
    commandType: CommandType.jmp,
    addressingMode: AddressingMode.absolute,
  },
  0x6c: {
    commandType: CommandType.jmp,
    addressingMode: AddressingMode.indirect,
  },
  // * JSR
  0x20: {
    commandType: CommandType.jsr,
    addressingMode: AddressingMode.absolute,
  },
  // * LDA
  0xa9: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.immediate,
  },
  0xad: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.absolute,
  },
  0xa5: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.zeroPage,
  },
  0xa1: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.indirectX,
  },
  0xb1: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.indirectY,
  },
  0xb5: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.zeroPageX,
  },
  0xbd: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.absoluteX,
  },
  0xb9: {
    commandType: CommandType.lda,
    addressingMode: AddressingMode.absoluteY,
  },
  // * LDX
  0xa2: {
    commandType: CommandType.ldx,
    addressingMode: AddressingMode.immediate,
  },
  0xae: {
    commandType: CommandType.ldx,
    addressingMode: AddressingMode.absolute,
  },
  0xa6: {
    commandType: CommandType.ldx,
    addressingMode: AddressingMode.zeroPage,
  },
  0xb6: {
    commandType: CommandType.ldx,
    addressingMode: AddressingMode.zeroPageY,
  },
  0xbe: {
    commandType: CommandType.ldx,
    addressingMode: AddressingMode.absoluteY,
  },
  // * LDY
  0xa0: {
    commandType: CommandType.ldy,
    addressingMode: AddressingMode.immediate,
  },
  0xac: {
    commandType: CommandType.ldy,
    addressingMode: AddressingMode.absolute,
  },
  0xa4: {
    commandType: CommandType.ldy,
    addressingMode: AddressingMode.zeroPage,
  },
  0xb4: {
    commandType: CommandType.ldy,
    addressingMode: AddressingMode.zeroPageX,
  },
  0xbc: {
    commandType: CommandType.ldy,
    addressingMode: AddressingMode.absoluteX,
  },
  // * LSR
  0x4e: {
    commandType: CommandType.lsr,
    addressingMode: AddressingMode.absolute,
  },
  0x46: {
    commandType: CommandType.lsr,
    addressingMode: AddressingMode.zeroPage,
  },
  0x4a: {
    commandType: CommandType.lsr,
    addressingMode: AddressingMode.accumulator,
  },
  0x56: {
    commandType: CommandType.lsr,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x5e: {
    commandType: CommandType.lsr,
    addressingMode: AddressingMode.absoluteX,
  },
  // * NOP
  0xea: {
    commandType: CommandType.nop,
    addressingMode: AddressingMode.implied,
  },
  // * Stack Operations
  0x48: {
    commandType: CommandType.pha,
    addressingMode: AddressingMode.implied,
  },
  0x08: {
    commandType: CommandType.php,
    addressingMode: AddressingMode.implied,
  },
  0x68: {
    commandType: CommandType.pla,
    addressingMode: AddressingMode.implied,
  },
  0x28: {
    commandType: CommandType.plp,
    addressingMode: AddressingMode.implied,
  },
  // * ROL
  0x2e: {
    commandType: CommandType.rol,
    addressingMode: AddressingMode.absolute,
  },
  0x26: {
    commandType: CommandType.rol,
    addressingMode: AddressingMode.zeroPage,
  },
  0x2a: {
    commandType: CommandType.rol,
    addressingMode: AddressingMode.accumulator,
  },
  0x36: {
    commandType: CommandType.rol,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x3e: {
    commandType: CommandType.rol,
    addressingMode: AddressingMode.absoluteX,
  },
  // * ROR
  0x6e: {
    commandType: CommandType.ror,
    addressingMode: AddressingMode.absolute,
  },
  0x66: {
    commandType: CommandType.ror,
    addressingMode: AddressingMode.zeroPage,
  },
  0x6a: {
    commandType: CommandType.ror,
    addressingMode: AddressingMode.accumulator,
  },
  0x76: {
    commandType: CommandType.ror,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x7e: {
    commandType: CommandType.ror,
    addressingMode: AddressingMode.absoluteX,
  },
  // * RTI
  0x40: {
    commandType: CommandType.rti,
    addressingMode: AddressingMode.implied,
  },
  // * RTS
  0x60: {
    commandType: CommandType.rts,
    addressingMode: AddressingMode.implied,
  },
  // * SBC
  0xe9: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.immediate,
  },
  0xed: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.absolute,
  },
  0xe5: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.zeroPage,
  },
  0xe1: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.indirectX,
  },
  0xf1: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.indirectY,
  },
  0xf5: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.zeroPageX,
  },
  0xfd: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.absoluteX,
  },
  0xf9: {
    commandType: CommandType.sbc,
    addressingMode: AddressingMode.absoluteY,
  },
  // * Set flags
  0x38: {
    commandType: CommandType.sec,
    addressingMode: AddressingMode.implied,
  },
  0xf8: {
    commandType: CommandType.sed,
    addressingMode: AddressingMode.implied,
  },
  0x78: {
    commandType: CommandType.sei,
    addressingMode: AddressingMode.implied,
  },
  // * STA
  0x8d: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.absolute,
  },
  0x85: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.zeroPage,
  },
  0x95: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.zeroPageX,
  },
  0x81: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.indirectX,
  },
  0x91: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.indirectY,
  },
  0x9d: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.absoluteX,
  },
  0x99: {
    commandType: CommandType.sta,
    addressingMode: AddressingMode.absoluteY,
  },
  // * STX
  0x8e: {
    commandType: CommandType.stx,
    addressingMode: AddressingMode.absolute,
  },
  0x86: {
    commandType: CommandType.stx,
    addressingMode: AddressingMode.zeroPage,
  },
  0x96: {
    commandType: CommandType.stx,
    addressingMode: AddressingMode.zeroPageY,
  },
  // * STY
  0x8c: {
    commandType: CommandType.sty,
    addressingMode: AddressingMode.absolute,
  },
  0x84: {
    commandType: CommandType.sty,
    addressingMode: AddressingMode.zeroPage,
  },
  0x94: {
    commandType: CommandType.sty,
    addressingMode: AddressingMode.zeroPageX,
  },
  // * TAX
  0xaa: {
    commandType: CommandType.tax,
    addressingMode: AddressingMode.implied,
  },
  // * TAY
  0xa8: {
    commandType: CommandType.tay,
    addressingMode: AddressingMode.implied,
  },
  // * TSX
  0xba: {
    commandType: CommandType.tsx,
    addressingMode: AddressingMode.implied,
  },
  0x8a: {
    commandType: CommandType.txa,
    addressingMode: AddressingMode.implied,
  },
  // * TXS
  0x9a: {
    commandType: CommandType.txs,
    addressingMode: AddressingMode.implied,
  },
  // * TYA
  0x98: {
    commandType: CommandType.tya,
    addressingMode: AddressingMode.implied,
  },
};

let bytesByCommand: Record<
  CommandType,
  Record<AddressingMode, number>
> = {} as any;

for (const [byte, { commandType, addressingMode }] of Object.entries(
  instructionSet as Record<number, Command>,
)) {
  bytesByCommand[commandType] = bytesByCommand[commandType] || {};
  bytesByCommand[commandType][addressingMode] = Number(byte);
}
