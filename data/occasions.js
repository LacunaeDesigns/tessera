/* occasions.js — occasion sets as data (docs/features/open-when.md is the
   copy source and calibration corpus). Adding a set is a data change, not an
   engine change. Copy rules: house voice, no urgency, no therapy-speak,
   prompts address the writer and point at the reader's specific life. */
(function (root) {
  'use strict';

  var OCCASIONS = [
    /* ---- the open-when set (v0.1, first-class: vision promise 2) ---- */
    {
      slug: 'open-when-sad',
      group: 'open-when',
      title: 'Open when you’re sad',
      coverLine: 'To be opened on a sad day, and no other kind.',
      canBeUndated: true,
      prompts: [
        'What do you wish someone would say to them tonight? Say it.',
        'Tell them one true thing you love about them that has nothing to do with anything they achieve.',
        'Remind them of a specific day the two of you were glad. Small is better than grand.'
      ]
    },
    {
      slug: 'open-when-doubt',
      group: 'open-when',
      title: 'Open when you doubt yourself',
      coverLine: 'To be opened when the doubt gets loud.',
      canBeUndated: true,
      prompts: [
        'Name the doubt you suspect they’ll be holding. Then tell them what you see instead, and how you know.',
        'Tell them about a time they were braver or better than they realised. Be exact.',
        'What would you trust them with, without hesitating? Tell them.'
      ]
    },
    {
      slug: 'open-when-3am',
      group: 'open-when',
      title: 'Open when it’s 3 a.m. and you can’t sleep',
      coverLine: 'To be opened in the small hours, when sleep won’t come.',
      canBeUndated: true,
      prompts: [
        'Keep them company first; fix nothing. What would you say if you were sitting on the kitchen floor with them?',
        'Tell them something quiet and ordinary about you, so the room feels less empty.',
        'Give them one small thing to do when they finish reading. Then say goodnight properly.'
      ]
    },
    {
      slug: 'open-when-lost',
      group: 'open-when',
      title: 'Open when you feel lost',
      coverLine: 'To be opened when the path has gone missing.',
      canBeUndated: true,
      prompts: [
        'Being lost isn’t failing; say so in your own words.',
        'Tell them what has stayed true about them in every version of them you’ve known.',
        'If they can’t see a path, name the very next stone: something they could do this week. Just one.'
      ]
    },
    {
      slug: 'open-when-proud',
      group: 'open-when',
      title: 'Open when something wonderful has happened',
      coverLine: 'To be opened on a day worth celebrating.',
      canBeUndated: true,
      prompts: [
        'You don’t know what it is yet. Celebrate them anyway; write the cheer you’d shout.',
        'Tell them you wanted to be there, and that in this way, you are.',
        'Ask them the question you’d ask across the table. They’ll answer out loud; that’s the point.'
      ]
    },

    /* ---- dated occasions (v0.1 starter set; the library grows in v0.3) ---- */
    {
      slug: 'milestone-18',
      group: 'milestone',
      title: 'To a child, at eighteen',
      coverLine: 'To be opened on an eighteenth birthday.',
      prompts: [
        'Tell them what they were like the week you wrote this. The details you’re sure you’ll remember are the ones that go first.',
        'What do you hope they’ve kept from being small? Name it.',
        'Give them one piece of advice you’d want them to hear from you and no one else.'
      ],
      deck: [
        { q: 'What were they like the week you wrote this? Start with something small and specific.' },
        { q: 'What did they do, when they were small, that you never want them to forget about themselves?' },
        { q: 'What were you afraid of for them when you wrote this? Say it plainly.' },
        { q: 'What did they teach you without meaning to?' },
        { q: 'What do you hope they have kept from being a child?' },
        { q: 'What is one thing you want them to hear from you and from no one else?' },
        { q: 'If you could be in the room when they read this, what would you say first?' }
      ]
    },
    {
      slug: 'future-self',
      group: 'milestone',
      title: 'To your future self',
      coverLine: 'A letter from the person you were.',
      prompts: [
        'Tell yourself what today was actually like, not how you’ll want to remember it.',
        'What are you afraid of right now? Future you will want to know how this felt.',
        'Ask yourself the question you most want answered by then.'
      ]
    },
    {
      slug: 'anniversary',
      group: 'milestone',
      title: 'For an anniversary',
      coverLine: 'To be opened together, on the day.',
      prompts: [
        'Write down one thing about them, right now, that you never want to forget.',
        'What did you two survive this year? Name it plainly and kindly.',
        'Make them one small promise for the year the letter opens.'
      ]
    },
    {
      slug: 'stranger-2126',
      group: 'far',
      title: 'To a stranger in the far future',
      coverLine: 'To whoever finds this, a long time from now.',
      prompts: [
        'Introduce yourself the way you’d want to be met, not summarised.',
        'Describe one ordinary thing from your day that you suspect will be gone by theirs.',
        'What do you want them to know that no history will bother to record?'
      ]
    },
    {
      slug: 'graduation',
      group: 'milestone',
      title: 'For a graduation',
      coverLine: 'To be opened on the day they finish.',
      prompts: [
        'Tell them what you saw them push through to get here, the part no stage will mention.',
        'What are you proud of that has nothing to do with the grade or the gown? Say it plainly.',
        'Give them one thing to carry into whatever comes next, in your words and not a speech’s.'
      ]
    },
    {
      slug: 'open-when-heartbroken',
      group: 'open-when',
      title: 'Open when your heart is broken',
      coverLine: 'To be opened when someone has broken it.',
      canBeUndated: true,
      prompts: [
        'Fix nothing. Tell them the plain thing you know: it hurts like this because it mattered.',
        'Remind them who they were before this person, and that the person is still in there.',
        'Name one ordinary joy that will still be waiting when the worst of it passes. Be specific.'
      ]
    },
    {
      slug: 'marrying-my-child',
      group: 'milestone',
      title: 'To the person marrying my child',
      coverLine: 'To be opened by the one who marries them.',
      prompts: [
        'Tell them one thing about the person they are marrying that they may not have seen yet.',
        'What do you hope they will be gentle with? Name it without any warning attached.',
        'Welcome them into the family in the words you would actually use, not a toast’s.'
      ]
    },
    {
      slug: 'retirement',
      group: 'milestone',
      title: 'For a retirement',
      coverLine: 'To be opened on the last day, or the first free morning after.',
      prompts: [
        'Tell them what their work meant to the people around it, the part no review recorded.',
        'What are you glad they will finally have time for? Point at the actual thing.',
        'Wish them something for the mornings that no longer belong to anyone else.'
      ]
    },
    {
      slug: 'last-day',
      group: 'milestone',
      title: 'To yourself, on your last day of work',
      coverLine: 'To be opened on the last day you clock out.',
      canBeUndated: true,
      prompts: [
        'Tell your future self what the work cost and what it gave, before you round it into a story.',
        'What did you want it to add up to when you started? Say so, so you can meet it honestly then.',
        'Name one thing you promise to do with the time that comes after.'
      ]
    },
    {
      slug: 'next-owner',
      group: 'far',
      title: 'To the next owner of this house',
      coverLine: 'To be opened by whoever lives here next.',
      canBeUndated: true,
      prompts: [
        'Tell them one thing about this house that only someone who has lived here would know. Where the morning light lands, which stair complains.',
        'What happened here that mattered to you? Name the actual room, so they can stand in it.',
        'Wish them something for their life inside these walls. Be specific to the rooms, not to life in general.'
      ]
    },
    {
      slug: 'custom',
      group: 'custom',
      title: 'Something else',
      coverLine: '',
      prompts: []
    }
  ];

  function bySlug(slug) {
    for (var i = 0; i < OCCASIONS.length; i++) if (OCCASIONS[i].slug === slug) return OCCASIONS[i];
    return OCCASIONS[OCCASIONS.length - 1];
  }

  var api = { OCCASIONS: OCCASIONS, bySlug: bySlug };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TesseraOccasions = api;
})(typeof self !== 'undefined' ? self : this);
