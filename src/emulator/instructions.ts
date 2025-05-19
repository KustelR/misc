import { Word } from "./memory";

export enum CommandType {
  adc,
  and,
  sta,
  inx,
  brk,
}

export enum AddressingMode {
  implied,
  immediate,
  absolute,
  absoluteX,
  absoluteY,
  zeroPage,
  zeroPageX,
  zeroPageY,
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
    case AddressingMode.implied: {
      return 0;
    }
    case AddressingMode.immediate:
    case AddressingMode.zeroPage:
    case AddressingMode.zeroPageX:
    case AddressingMode.zeroPageY: {
      return 1;
    }
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
  switch (data.toNumber()) {
    // *^ ADC
    case 0x69:
      return {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.immediate,
      };
    case 0x6d: {
      return {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.absolute,
      };
    }
    case 0x65: {
      return {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.zeroPage,
      };
    }
    case 0x75: {
      return {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.zeroPageX,
      };
    }
    case 0x7d: {
      return {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.absoluteX,
      };
    }
    case 0x79: {
      return {
        commandType: CommandType.adc,
        addressingMode: AddressingMode.absoluteY,
      };
    }
    case 0x29:
      return {
        commandType: CommandType.sta,
        addressingMode: AddressingMode.immediate,
      };

    case 0xe8:
      return {
        commandType: CommandType.inx,
        addressingMode: AddressingMode.implied,
      };

    // *^ STA
    case 0x8d: {
      return {
        commandType: CommandType.sta,
        addressingMode: AddressingMode.absolute,
      };
    }
    case 0x85: {
      return {
        commandType: CommandType.sta,
        addressingMode: AddressingMode.zeroPage,
      };
    }
    case 0x95: {
      return {
        commandType: CommandType.sta,
        addressingMode: AddressingMode.zeroPageX,
      };
    }
    case 0x9d: {
      return {
        commandType: CommandType.sta,
        addressingMode: AddressingMode.absoluteX,
      };
    }

    // *^ AND
    case 0x29:
      return {
        commandType: CommandType.and,
        addressingMode: AddressingMode.immediate,
      };
    case 0x2d:
      return {
        commandType: CommandType.and,
        addressingMode: AddressingMode.absolute,
      };
    case 0x25:
      return {
        commandType: CommandType.and,
        addressingMode: AddressingMode.zeroPage,
      };
    case 0x35:
      return {
        commandType: CommandType.and,
        addressingMode: AddressingMode.zeroPageX,
      };
    case 0x3d:
      return {
        commandType: CommandType.and,
        addressingMode: AddressingMode.absoluteX,
      };
    case 0x39:
      return {
        commandType: CommandType.and,
        addressingMode: AddressingMode.absoluteY,
      };

    // *^ BRK
    case 0x00: {
      return {
        commandType: CommandType.brk,
        addressingMode: AddressingMode.implied,
      };
    }
    default:
      return undefined;
  }
}
