// Shattered Realm — Blacksmith
// 24x32 Pixel tier — bald/bandana, leather apron, hammer, muscular

module.exports = {
  width: 24, height: 32, style: 'pixel', entityType: 'character',
  colors: {
    apron: '#6a4a2a',
    skin: '#d4a070',
    pants: '#3a3a4a',
    bandana: '#aa3322',
    hammer: '#8a8a9a',
  },
  draw(pc, pal) {
    const ap = pal.groups.apron.startIdx;
    const sk = pal.groups.skin.startIdx;
    const pn = pal.groups.pants.startIdx;
    const bn = pal.groups.bandana.startIdx;
    const hm = pal.groups.hammer.startIdx;
    const cx = 12;

    // Shadow
    pc.fillEllipse(cx, 30, 9, 2, pn+0);

    // Boots
    pc.fillRect(7, 26, 4, 3, pn+0);
    pc.fillRect(13, 26, 4, 3, pn+0);

    // Legs — dark pants
    pc.fillRect(8, 22, 3, 5, pn+1);
    pc.fillRect(13, 22, 3, 5, pn+1);

    // Body — broad (muscular build)
    pc.fillRect(5, 11, 14, 11, sk+1);

    // Leather apron over body
    pc.fillRect(7, 12, 10, 10, ap+2);
    // Apron straps
    pc.vline(8, 10, 3, ap+1);
    pc.vline(15, 10, 3, ap+1);
    // Apron pocket
    pc.fillRect(9, 18, 4, 3, ap+1);
    pc.hline(9, 18, 4, ap+0);

    // Belt
    pc.fillRect(6, 21, 12, 1, ap+0);

    // Arms (thick/muscular, skin showing)
    pc.fillRect(3, 12, 4, 7, sk+2);
    pc.fillRect(17, 12, 4, 7, sk+2);
    // Arm highlights (muscle)
    pc.setPixel(4, 14, sk+3);
    pc.setPixel(19, 14, sk+3);

    // Hands
    pc.fillRect(3, 18, 3, 2, sk+2);
    pc.fillRect(18, 18, 3, 2, sk+2);

    // Hammer (right hand)
    pc.vline(20, 6, 14, ap+1); // handle
    // Hammer head
    pc.fillRect(18, 4, 5, 4, hm+2);
    pc.fillRect(18, 4, 5, 1, hm+3); // highlight
    pc.fillRect(18, 7, 5, 1, hm+0); // shadow

    // Head (bald/broad)
    pc.fillEllipse(cx, 7, 5, 5, sk+2);
    // Face
    pc.setPixel(10, 7, pn+0);
    pc.setPixel(14, 7, pn+0);
    pc.hline(11, 9, 2, sk+1);

    // Red bandana
    pc.fillRect(7, 3, 10, 2, bn+2);
    pc.hline(7, 5, 10, bn+1);
    // Bandana tail (hangs right)
    pc.setPixel(17, 4, bn+1);
    pc.setPixel(18, 5, bn+1);
    // Highlight
    pc.setPixel(9, 3, bn+3);
  },
};
