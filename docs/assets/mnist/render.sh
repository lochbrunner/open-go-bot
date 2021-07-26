#!/usr/bin/bash

ffmpeg \
-framerate 10 -loop 1 -t 0.6 -i mnist.config.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.3.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.4.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.7.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.3.1.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.4.1.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.8.png \
-framerate 10 -loop 1 -t 2 -i mnist.9.0.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.1.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.2.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.3.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.4.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.5.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.6.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.7.png \
-framerate 10 -loop 1 -t 0.3 -i mnist.9.8.png \
-framerate 10 -loop 1 -t 2 -i mnist.live.0.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.live.1.png \
-framerate 10 -loop 1 -t 0.6 -i mnist.live.2.png \
-filter_complex \
"[1]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+2/TB[f0]; \
 [2]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+4/TB[f1]; \
 [3]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+6/TB[f2]; \
 [4]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+8/TB[f3]; \
 [5]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+10/TB[f4]; \
 [6]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+12/TB[f5]; \
 [7]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+14/TB[f6]; \
 [8]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+16/TB[f7]; \
 [9]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+17/TB[f8]; \
 [10]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+18/TB[f9]; \
 [11]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+19/TB[f10]; \
 [12]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+20/TB[f11]; \
 [13]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+21/TB[f12]; \
 [14]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+22/TB[f13]; \
 [15]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+23/TB[f14]; \
 [16]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+25/TB[f15]; \
 [17]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+27/TB[f16]; \
 [18]format=rgba,fade=d=0.2:t=in:alpha=1,setpts=PTS-STARTPTS+29/TB[f17]; \
 [0][f0]overlay[bg1]; \
 [bg1][f1]overlay[bg2]; \
 [bg2][f2]overlay[bg3]; \
 [bg3][f3]overlay[bg4]; \
 [bg4][f4]overlay[bg5]; \
 [bg5][f5]overlay[bg6]; \
 [bg6][f6]overlay[bg7]; \
 [bg7][f7]overlay[bg8]; \
 [bg8][f8]overlay[bg9]; \
 [bg9][f9]overlay[bg10]; \
 [bg10][f10]overlay[bg11]; \
 [bg11][f11]overlay[bg12]; \
 [bg12][f12]overlay[bg13]; \
 [bg13][f13]overlay[bg14]; \
 [bg14][f14]overlay[bg15]; \
 [bg15][f15]overlay[bg16]; \
 [bg16][f16]overlay[bg17]; \
 [bg17][f17]overlay,split[v0][v1]; \
 [v0]palettegen[p];[v1][p]paletteuse[v]" -map "[v]" mnist.gif
