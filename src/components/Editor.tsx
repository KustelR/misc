"use client";

import CodeMirror from "@uiw/react-codemirror";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { androidstudio } from "@uiw/codemirror-theme-androidstudio";

export default function Editor() {
  return (
    <div className="flex-1 p-2 overflow-auto">
      <CodeMirror
        className="sm:w-full md:w-[400px] lg:w-[700px] whitespace-pre"
        theme={androidstudio}
        value={SAMPLE_CODE}
      />
    </div>
  );
}

const SAMPLE_CODE = `define gpuMemMinor $a0
define gpuMemMajor $a1
define gpuMemMinorMirror $a2
define gpuMemMajorMirror $a3
define spawnIterations $ff

define mirrorStart $11

define cn_left $1e00
define cn_right $1e01
define cn_top $1e02
define cn_bottom $1e03
define cn_originX $1e04
define cn_originY $1e05
define cn_neighbourCount $1e06

define lcl_liveData $1e07
define lcl_around $1e08

JSR main
BRK 

;accepts x reg as x coordinate, y register as y coordinate, $1e0f as mode. outputs x as minor byte and y as major byte
convertCoordinates:
LDA #$02
STX $1ff0
STA $1f01
CPY #$08
BCC cc_height_render
INC $1f01
CPY #$10
BCC cc_height_render
INC $1f01
CPY #$18
BCC cc_height_render 
INC $1f01
cc_height_render:
STY $1f00
LDA $1f01
SEC 
SBC #$02
TAY 
LDX #$08
JSR multiply
STX $aa
LDA $1f00
SEC 
SBC $aa
TAY 
LDX #$20
JSR multiply 
TXA 
CLC 
ADC $1ff0
STA $1ff0

LDX $1ff0
LDY $1f01
RTS 

; num1 in x, num2 in y, result in x
multiply:
PHA 
TYA 
PHA 
LDA #$00
STY $ab
STX $aa
CPY #$0
BNE m_loop 
LDX #$00
BCS m_end
m_loop:
CLC 
ADC $aa
DEY 
CPY #$00
BNE m_loop
TAX 
m_end:
PLA 
TAY 
PLA 
RTS 

clearScreen_sr:
JSR saveRegisters
LDX #$2
LDY #$0
LDA #$0
cs_loop:
STX $a1
cs_loop2:
STA ($a0), Y
INY 
CPY #$ff
BCC cs_loop2 
INX 
CPX #$06
BCC cs_loop 
JSR loadRegisters 
RTS 

saveRegisters:
STA $1000
STX $1001
STY $1002
RTS 

loadRegisters:
LDA $1000
LDX $1001
LDY $1002
RTS 

;accepts x reg as x coordinate, y reg as y coordinate, a as color, $1f0e as mode (0 is gpu, 1 is mirror)
drawDot_sr:
JSR saveRegisters
PHA 
LDA #$0
JSR convertCoordinates 
PLA 
STX gpuMemMinor
STY gpuMemMajor
LDY #$0
STA (gpuMemMinor), Y
JSR loadRegisters 
RTS 

; accepts x reg as x coordinate, y reg as y coordinate, a as mode. outputs color as accum
getDotColor_sr:
JSR saveRegisters 
LDA #$0
JSR convertCoordinates
STX gpuMemMinor
STY gpuMemMajor
LDY #$0
LDA (gpuMemMinor), Y
STA $ac
JSR loadRegisters 
LDA $ac
RTS 

;outputs random number in between 0 and 19 (inclusive) to accumulator
getRandomCoordinate:
LDA $fe
LSR
LSR
LSR 
RTS 

drawToMirror_sr:
JSR saveRegisters 
JSR convertCoordinates 
TYA 
CLC 
ADC #$0f
TAY 
STY gpuMemMajorMirror
STX gpuMemMinorMirror
JSR loadRegisters 
LDY #$0
STA (gpuMemMinorMirror), Y
JSR loadRegisters 
RTS 

loadMirror_sr:
JSR saveRegisters

LDY #$00
STY gpuMemMinor
STY gpuMemMinorMirror
LDA #$02
STA gpuMemMajor
LDA #$11
STA gpuMemMajorMirror
lm_loop2:
LDY #$0
lm_loop:
LDA (gpuMemMinorMirror), Y
STA (gpuMemMinor), Y

INY 
CPY #$0
BNE lm_loop
INC gpuMemMajor
INC gpuMemMajorMirror
LDA gpuMemMajor
CMP #$06
BCC lm_loop2 
JSR loadRegisters
RTS 
clearMirror_sr:
JSR saveRegisters

LDY #$00
STY gpuMemMinorMirror
LDA #$11
STA gpuMemMajorMirror
cm_loop2:
LDY #$0
cm_loop:
LDA #$0
STA (gpuMemMinorMirror), Y

INY 
CPY #$0
BNE cm_loop
INC gpuMemMajorMirror
LDA gpuMemMajorMirror
CMP #$15
BCC cm_loop2 
JSR loadRegisters
RTS 


main:
JSR clearMirror_sr 
JSR populateRandom_sr

loop:
JSR clearMirror_sr 
JSR lifeCycleLoop_sr
JSR loadMirror_sr 
CLC 
BCC loop
RTS 

populateRandom_sr:
JSR saveRegisters 
LDX #$0
pr_loop:
TXA 
PHA 
TYA 
PHA 
JSR getRandomCoordinate 
TAX 
JSR getRandomCoordinate 
TAY 
LDA #$1
JSR drawDot_sr
PLA 
TAY 
PLA 
TAX 
INX 
CPX #spawnIterations
BCC pr_loop
JSR loadRegisters 
RTS 

;accepts x and y as coordinates of original cell. outputs amount of alive neighbours in a
checkNeighbours_sr:
LDA #$0
STA cn_neighbourCount
STX cn_originX
STY cn_originY

DEX 
CPX #$ff
BNE cn_skip
LDX #$1f
cn_skip:
STX cn_left

DEY 
CPY #$ff
BNE cn_skip2
LDY #$1f
cn_skip2:
STY cn_top

INX 
INX 
CPX #$20
BNE cn_skip3 
LDX #$00
cn_skip3:
STX cn_right

INY 
INY 
CPY #$20
BNE cn_skip4
LDX #$00
cn_skip4:
STY cn_bottom

LDX cn_left
LDY cn_originY
JSR getDotColor_sr 
CMP #$1
BNE cn_rightCheck 
INC cn_neighbourCount

cn_rightCheck:
LDX cn_right
LDY cn_originY
JSR getDotColor_sr 
CMP #$1
BNE cn_topCheck 
INC cn_neighbourCount

cn_topCheck:
LDX cn_originX
LDY cn_top
JSR getDotColor_sr 
CMP #$1
BNE cn_bottomCheck
INC cn_neighbourCount

cn_bottomCheck:
LDX cn_originX
LDY cn_bottom
JSR getDotColor_sr 
CMP #$1
BNE cn_topLeftCheck
INC cn_neighbourCount

cn_topLeftCheck:
LDX cn_left
LDY cn_top
JSR getDotColor_sr 
CMP #$1
BNE cn_topRightCheck 
INC cn_neighbourCount

cn_topRightCheck:
LDX cn_right
LDY cn_top
JSR getDotColor_sr 
CMP #$1
BNE cn_bottomLeftCheck 
INC cn_neighbourCount

cn_bottomLeftCheck:
LDX cn_left
LDY cn_bottom
JSR getDotColor_sr 
CMP #$1
BNE cn_bottomRightCheck
INC cn_neighbourCount

cn_bottomRightCheck:
LDX cn_right
LDY cn_bottom
JSR getDotColor_sr 
CMP #$1
BNE cn_end 
INC cn_neighbourCount

cn_end:
LDA cn_neighbourCount
LDX cn_originX
LDY cn_originY
RTS 

lifeCycleLoop_sr:
LDX #$0
LDY #$0
lcl_loop2:
lcl_loop:
JSR getDotColor_sr 
STA lcl_liveData
JSR checkNeighbours_sr 
STA lcl_around

LDA lcl_liveData
CMP #$1
BNE lcl_dead
LDA lcl_around
CMP #$2
BCC lcl_death
CMP #$4
BCC lcl_life
BCS lcl_death
lcl_death:
LDA #$0
JSR drawToMirror_sr
CLC 
BCC lcl_skip 
lcl_life:
LDA #$1
JSR drawToMirror_sr
CLC 
BCC lcl_skip 

lcl_dead:
LDA lcl_around
CMP #$3
BEQ lcl_life 
CLC 
BCC lcl_death
lcl_skip:
INX 
CPX #$20
BCC lcl_loop 
LDX #$0
INY 
CPY #$20
BCC lcl_loop2 
RTS `;
