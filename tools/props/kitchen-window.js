// Kitchen window — 48x40 background decoration
// Wooden frame, 4 glass panes (2x2 grid), sky visible through, sill at bottom.
module.exports = {
  width: 48, height: 40,
  colors: {
    frame: '#887055',   // warm wood frame
    glass: '#99ccee',   // sky blue glass
    sky: '#bbddff',     // lighter sky at top
    sill: '#998866',    // window sill
  },

  draw(pc, pal) {
    const f = pal.groups.frame.startIdx;
    const g = pal.groups.glass.startIdx;
    const sk = pal.groups.sky.startIdx;
    const si = pal.groups.sill.startIdx;

    // Outer frame
    pc.fillRect(0, 0, 48, 36, f + 2);
    // Frame highlight top/left
    pc.hline(1, 0, 46, f + 3);
    pc.vline(0, 1, 34, f + 3);
    // Frame shadow bottom/right
    pc.hline(1, 35, 46, f);
    pc.vline(47, 1, 34, f + 1);

    // Glass panes — 4 panes in a 2x2 grid
    var paneW = 18, paneH = 13;
    var inset = 3;
    // Top-left pane
    pc.fillRect(inset, inset, paneW, paneH, sk + 2);
    pc.fillRect(inset, inset + 4, paneW, paneH - 4, g + 2);
    // Top-right pane
    pc.fillRect(inset + paneW + 6, inset, paneW, paneH, sk + 2);
    pc.fillRect(inset + paneW + 6, inset + 4, paneW, paneH - 4, g + 2);
    // Bottom-left pane
    pc.fillRect(inset, inset + paneH + 4, paneW, paneH, g + 2);
    pc.fillRect(inset, inset + paneH + 4, paneW, 4, g + 3);
    // Bottom-right pane
    pc.fillRect(inset + paneW + 6, inset + paneH + 4, paneW, paneH, g + 2);
    pc.fillRect(inset + paneW + 6, inset + paneH + 4, paneW, 4, g + 3);

    // Cross bars (frame between panes)
    pc.fillRect(inset + paneW, inset, 6, paneH * 2 + 4, f + 2);
    pc.fillRect(inset, inset + paneH, paneW * 2 + 6, 4, f + 2);
    // Cross bar highlights
    pc.vline(inset + paneW, inset, paneH * 2 + 4, f + 3);
    pc.hline(inset, inset + paneH, paneW * 2 + 6, f + 3);

    // Window sill — prottrudes slightly
    pc.fillRect(0, 36, 48, 4, si + 2);
    pc.hline(0, 36, 48, si + 3);
    pc.hline(0, 39, 48, si);

    // Glass reflections — diagonal highlight streaks
    pc.line(inset + 2, inset + 2, inset + 6, inset + paneH - 2, sk + 3);
    pc.line(inset + paneW + 8, inset + 2, inset + paneW + 12, inset + paneH - 2, sk + 3);
  },
  drawPost(pc, pal) {},
};
