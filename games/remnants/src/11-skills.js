
// ============================================================
// SKILLS — Generic XP / leveling for all skill systems
// ============================================================

// PlayerSkills: tracks XP and levels per skill
// Stored as: { skillId: { xp: n, level: n }, ... }

var PlayerSkills = {
  create: function() { return {}; },

  // Add XP to a skill, returns { leveled: bool, level: n } if level up
  addXp: function(skills, skillId, amount) {
    if (!skills[skillId]) skills[skillId] = { xp: 0, level: 1 };
    var s = skills[skillId];
    s.xp += amount;
    var needed = PlayerSkills.xpForLevel(s.level + 1);
    var leveled = false;
    while (s.xp >= needed) {
      s.xp -= needed;
      s.level++;
      leveled = true;
      needed = PlayerSkills.xpForLevel(s.level + 1);
    }
    return { leveled: leveled, level: s.level };
  },

  getLevel: function(skills, skillId) {
    return skills[skillId] ? skills[skillId].level : 0;
  },

  getXp: function(skills, skillId) {
    return skills[skillId] ? skills[skillId].xp : 0;
  },

  // XP needed to reach a given level
  xpForLevel: function(level) {
    return Math.round(10 * Math.pow(1.4, level - 1));
  },

  // Progress to next level as 0-1
  progress: function(skills, skillId) {
    if (!skills[skillId]) return 0;
    var s = skills[skillId];
    var needed = PlayerSkills.xpForLevel(s.level + 1);
    return needed > 0 ? s.xp / needed : 0;
  },

  // Get all skills as sorted array [{id, level, xp, def}, ...]
  list: function(skills) {
    var result = [];
    for (var id in skills) {
      result.push({ id: id, level: skills[id].level, xp: skills[id].xp, def: SkillRegistry.get(id) });
    }
    result.sort(function(a, b) { return a.id < b.id ? -1 : 1; });
    return result;
  },
};
