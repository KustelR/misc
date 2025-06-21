import { describe, expect, it } from "vitest";
import {
  compile,
  getAddressMode,
  getArgumentBytes,
  getCmdFromToken,
  getLineType,
  processReference,
  replaceLabels,
  tokenize,
} from "./compiler";
import { AddressingMode, CommandType } from "./instructions";
import { DoubleWord, Word } from "./memory";

const INSTRUCTIONS = [
  "adc",
  "and",
  "asl",
  "bcc",
  "bcs",
  "beq",
  "bit",
  "bmi",
  "bne",
  "bpl",
  "bvc",
  "bvs",
  "clc",
  "cld",
  "cli",
  "clv",
  "cmp",
  "cpx",
  "cpy",
  "dec",
  "dex",
  "dey",
  "inc",
  "inx",
  "iny",
  "jmp",
  "jsr",
  "lda",
  "ldx",
  "ldy",
  "nop",
  "ora",
  "pha",
  "php",
  "pla",
  "plp",
  "rol",
  "ror",
  "rti",
  "rts",
  "sbc",
  "sec",
  "sed",
  "sei",
  "sta",
  "stx",
  "sty",
  "tax",
  "tay",
  "tsx",
];

describe("testing getCmdFromToken()", () => {
  it("should ignore register", () => {
    expect(getCmdFromToken("lda")).toBe(CommandType.lda);
    expect(getCmdFromToken("LDA")).toBe(CommandType.lda);
  });
  it("should recognize all command tokens", () => {
    INSTRUCTIONS.forEach((instruction) => {
      const cmd = getCmdFromToken(instruction);
      if (cmd === undefined)
        throw new Error(
          `Instruction can't be recognized: ${instruction} / ${cmd}`,
        );
    });
  });
  it("should return undefined on unknown instruction", () => {
    expect(getCmdFromToken("aaa")).toBeUndefined();
  });
});

describe("testing getAddressMode()", () => {
  it("should recognize accumulator", () => {
    expect(getAddressMode(CommandType.lsr, "A")).toBe(
      AddressingMode.accumulator,
    );
  });
  it("should recognize absolute", () => {
    expect(getAddressMode(CommandType.lda, "$0000")).toBe(
      AddressingMode.absolute,
    );
  });
  it("should recognize absoluteX", () => {
    expect(getAddressMode(CommandType.lda, "$0000, X")).toBe(
      AddressingMode.absoluteX,
    );
  });
  it("should recognize absoluteY", () => {
    expect(getAddressMode(CommandType.lda, "$0000, Y")).toBe(
      AddressingMode.absoluteY,
    );
  });
  it("should recognize implied", () => {
    expect(getAddressMode(CommandType.inx, undefined)).toBe(
      AddressingMode.implied,
    );
  });
  it("should recognize indirect", () => {
    expect(getAddressMode(CommandType.inx, "($0000)")).toBe(
      AddressingMode.indirect,
    );
  });
  it("should recognize indirectX", () => {
    expect(getAddressMode(CommandType.inx, "($00, X)")).toBe(
      AddressingMode.indirectX,
    );
  });
  it("should recognize indirectY", () => {
    expect(getAddressMode(CommandType.cmp, "($00), Y")).toBe(
      AddressingMode.indirectY,
    );
  });
  it("should recognize zeroPage", () => {
    expect(getAddressMode(CommandType.inx, "$00")).toBe(
      AddressingMode.zeroPage,
    );
  });
  it("should recognize zeroPageX", () => {
    expect(getAddressMode(CommandType.inx, "$00, X")).toBe(
      AddressingMode.zeroPageX,
    );
  });
  it("should recognize zeroPageY", () => {
    expect(getAddressMode(CommandType.ldx, "$00, Y")).toBe(
      AddressingMode.zeroPageY,
    );
  });
});

describe("testing tokenize()", () => {
  it("should parse instructions correctly", () => {
    const result = tokenize("adc $00");
    expect(result).toEqual(["adc", "$00"]);
  });
  it("should parse labels correctly", () => {
    const result = tokenize("stArt:");
    expect(result).toEqual(["stArt:"]);
  });
  it("should tokenize references correctly", () => {
    const result = tokenize("jmp somewhere");
    expect(result).toEqual(["jmp", "somewhere"]);
  });
  it("should parse number addresses correctly", () => {
    const result: string[][] = [];
    const data: Array<string> = ["$01", "$1", "$0001", "*+01", "*-1"];
    data.forEach((d) => result.push(tokenize(d)));
    expect(result).toEqual([["$01"], ["$1"], ["$0001"], ["*+01"], ["*-1"]]);
  });
  it("should parse addresses with regs", () => {
    const result: string[][] = [];
    const data: Array<string> = [
      "$01, X",
      "$01, Y",
      "$0000, X",
      "$0000, Y",
      "($01, X)",
      "($01), Y",
      "A",
    ];

    data.forEach((d) => result.push(tokenize(d)));
    expect(result).toEqual([
      ["$01, X"],
      ["$01, Y"],
      ["$0000, X"],
      ["$0000, Y"],
      ["($01, X)"],
      ["($01), Y"],
      ["A"],
    ]);
  });
});

describe("testing processReference()", () => {
  it("should replace reference with address", () => {
    const labels = { myLabel: 0x1234 };
    const constants = { myConst: "1111" };
    const result = processReference("myLabel", labels, constants);
    expect(result).toEqual("{myLabel}");
  });
  it("should replace constant with value", () => {
    const labels = { myLabel: 0x1234 };
    const constants = { myConst: "1111" };
    const result = processReference("#myConst", labels, constants);
    expect(result).toEqual("#1111");
  });
  it("should throw on bad prefix", () => {
    const labels = { myLabel: 0x1234 };
    const constants = { myConst: "1111" };
    const f = () => processReference(".myConst", labels, constants);
    expect(f).toThrowError("Reference should start with # or $");
  });
});

describe("testing getLineType()", () => {
  it("should detect definition", () => {
    const result = getLineType("define myConst $1111");
    expect(result).toEqual({
      isDefinition: true,
      isLabel: false,
      hasReference: false,
    });
  });
  it("should detect label", () => {
    const result = getLineType("myLabel:");
    expect(result).toEqual({
      isDefinition: false,
      isLabel: true,
      hasReference: false,
    });
  });
  it("should detect reference", () => {
    const result = getLineType("jmp myLabel");
    expect(result).toEqual({
      isDefinition: false,
      isLabel: false,
      hasReference: true,
    });
  });
  it("should detect nothing", () => {
    const result = getLineType("nop");
    expect(result).toEqual({
      isDefinition: false,
      isLabel: false,
      hasReference: false,
    });
  });
});

describe("testing replaceLabels()", () => {
  it("should replace label with address", () => {
    const result = replaceLabels(
      "{myLabel}",
      {
        myLabel: new DoubleWord(0x2000),
      },
      new DoubleWord(0x1),
    );
    expect(result).toEqual("$2000");
  });
  it("should replace label with positive relative address", () => {
    const result = replaceLabels(
      "{myLabel}",
      {
        myLabel: new DoubleWord(0x610),
      },
      new DoubleWord(0x600),
      true,
    );
    expect(result).toEqual("*+10");
  });
  it("should replace label with negative relative address", () => {
    const result = replaceLabels(
      "{myLabel}",
      {
        myLabel: new DoubleWord(0x600),
      },
      new DoubleWord(0x610),
      true,
    );
    expect(result).toEqual("*-10");
  });
});

describe("testing getArgumentBytes()", () => {
  it("should return bytes for immediate values", () => {
    const result = getArgumentBytes("#$01");
    expect(result).toEqual([new Word(0x01)]);
  });
  it("should return bytes for zero page addresses", () => {
    const result = getArgumentBytes("$01");
    expect(result).toEqual([new Word(0x01)]);
  });
  it("should return bytes for absolute addresses", () => {
    const result = getArgumentBytes("$0001");
    expect(result).toEqual([new Word(0x01), new Word(0x00)]);
  });
  it("should return bytes for indirect addresses", () => {
    const result = getArgumentBytes("($0001)");
    expect(result).toEqual([new Word(0x01), new Word(0x00)]);
  });
  it("should return bytes for relative addresses", () => {
    const result = getArgumentBytes("*+01");
    expect(result).toEqual([new Word(0x01)]);
  });
  it("should return bytes for relative negative addresses", () => {
    const result = getArgumentBytes("*-01");
    expect(result).toEqual([new Word(0x81)]);
  });
});

describe("testing compile()", () => {
  it("should compile one instruction", () => {
    const result = compile("nop", new DoubleWord(0x0600));
    expect(result).toBeDefined();
  });
  it("should ignore empty lines", () => {
    const source1 = `
      lda #01
      start:
      inx
      jmp start`;
    const source2 = `
      lda #01

      start:

      inx

      jmp start`;

    const result1 = compile(source1, new DoubleWord(0x0600));
    const result2 = compile(source2, new DoubleWord(0x0600));
    expect(result1).toEqual(result2);
  });
  it("should compile labeled assembly", () => {
    const source = `  LDA #$01
  CMP #$02
  BNE notequal
  STA $22
notequal:
  BRK`;
    const result = compile(source, new DoubleWord(0x0600));
    expect(result).toBeDefined();
  });
});
