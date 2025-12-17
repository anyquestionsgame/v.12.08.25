export interface Question {
  category: string;
  difficulty: number;
  questionText: string;
  rangeText: string;
  playerPrompt: string;
  answer: {
    display: string;
    acceptable: string[];
  };
}

// Mock questions for testing
// Format: 4 questions per difficulty (100/200/300/400) for each category

const questions: Question[] = [
  // CATS - 100 points
  {
    category: 'Cats',
    difficulty: 100,
    questionText: "What's a baby cat called?",
    rangeText: "This one's a gimme",
    playerPrompt: "don't overthink it, {playerName}",
    answer: {
      display: 'Kitten',
      acceptable: ['kitten', 'kitty', 'baby cat', 'kitten cat']
    }
  },
  {
    category: 'Cats',
    difficulty: 100,
    questionText: "How many lives do cats supposedly have?",
    rangeText: "Common knowledge",
    playerPrompt: "you got this, {playerName}",
    answer: {
      display: '9',
      acceptable: ['nine', '9', 'nine lives']
    }
  },
  {
    category: 'Cats',
    difficulty: 100,
    questionText: "What sound does a cat make?",
    rangeText: "Too easy",
    playerPrompt: "seriously, {playerName}?",
    answer: {
      display: 'Meow',
      acceptable: ['meow', 'meow meow', 'meowing', 'purr']
    }
  },
  {
    category: 'Cats',
    difficulty: 100,
    questionText: "What do cats use to clean themselves?",
    rangeText: "Basic cat knowledge",
    playerPrompt: "think about it, {playerName}",
    answer: {
      display: 'Their tongue',
      acceptable: ['tongue', 'their tongue', 'licking', 'grooming']
    }
  },

  // CATS - 200 points
  {
    category: 'Cats',
    difficulty: 200,
    questionText: "How many toes does a typical cat have on each front paw?",
    rangeText: "We'll give you within 1 toe",
    playerPrompt: "count carefully, {playerName}",
    answer: {
      display: '5',
      acceptable: ['five', '5', 'five toes', '4-6']
    }
  },
  {
    category: 'Cats',
    difficulty: 200,
    questionText: "What's the average number of hours a cat sleeps per day?",
    rangeText: "Within 2 hours",
    playerPrompt: "they're lazy, {playerName}",
    answer: {
      display: '12-16 hours',
      acceptable: ['12-16', '12 to 16', '14', 'around 14', '12-15']
    }
  },
  {
    category: 'Cats',
    difficulty: 200,
    questionText: "What's the scientific name for the domestic cat?",
    rangeText: "Two words, Latin",
    playerPrompt: "think taxonomy, {playerName}",
    answer: {
      display: 'Felis catus',
      acceptable: ['felis catus', 'felis catus', 'felis silvestris catus']
    }
  },
  {
    category: 'Cats',
    difficulty: 200,
    questionText: "How many whiskers does a cat typically have?",
    rangeText: "Within 4 whiskers",
    playerPrompt: "count the whiskers, {playerName}",
    answer: {
      display: '24',
      acceptable: ['24', 'twenty-four', '12 on each side', '20-24']
    }
  },

  // CATS - 300 points
  {
    category: 'Cats',
    difficulty: 300,
    questionText: "What's the maximum speed a domestic cat can run?",
    rangeText: "Within 5 mph",
    playerPrompt: "they're fast, {playerName}",
    answer: {
      display: '30 mph',
      acceptable: ['30 mph', '30 miles per hour', '25-35 mph', 'around 30']
    }
  },
  {
    category: 'Cats',
    difficulty: 300,
    questionText: "How many bones are in a cat's body?",
    rangeText: "Within 10 bones",
    playerPrompt: "we'll give you within 10, {playerName}",
    answer: {
      display: '230',
      acceptable: ['230', 'two hundred thirty', '225-235', 'around 230']
    }
  },
  {
    category: 'Cats',
    difficulty: 300,
    questionText: "What percentage of a cat's DNA is shared with humans?",
    rangeText: "Within 5%",
    playerPrompt: "think evolution, {playerName}",
    answer: {
      display: '90%',
      acceptable: ['90%', '90 percent', '85-95%', 'around 90']
    }
  },
  {
    category: 'Cats',
    difficulty: 300,
    questionText: "How many taste buds does a cat have?",
    rangeText: "Within 200",
    playerPrompt: "much fewer than humans, {playerName}",
    answer: {
      display: '473',
      acceptable: ['473', 'around 470', '450-500', '470-480']
    }
  },

  // CATS - 400 points
  {
    category: 'Cats',
    difficulty: 400,
    questionText: "What's the world record for the longest cat?",
    rangeText: "Within 2 inches",
    playerPrompt: "think really long, {playerName}",
    answer: {
      display: '48.5 inches',
      acceptable: ['48.5 inches', '48.5', '46-50 inches', 'around 48']
    }
  },
  {
    category: 'Cats',
    difficulty: 400,
    questionText: "How many different vocalizations can a cat make?",
    rangeText: "Within 20",
    playerPrompt: "more than you think, {playerName}",
    answer: {
      display: '100',
      acceptable: ['100', 'one hundred', '80-120', 'around 100']
    }
  },
  {
    category: 'Cats',
    difficulty: 400,
    questionText: "What's the oldest recorded age for a domestic cat?",
    rangeText: "Within 2 years",
    playerPrompt: "they live long, {playerName}",
    answer: {
      display: '38 years',
      acceptable: ['38 years', '38', '36-40 years', 'around 38']
    }
  },
  {
    category: 'Cats',
    difficulty: 400,
    questionText: "How many muscles does a cat have in each ear?",
    rangeText: "Within 10",
    playerPrompt: "they're expressive, {playerName}",
    answer: {
      display: '32',
      acceptable: ['32', 'thirty-two', '30-34', 'around 32']
    }
  },

  // EXCEL - 100 points
  {
    category: 'Excel',
    difficulty: 100,
    questionText: "What's the shortcut to save a file in Excel?",
    rangeText: "Common shortcut",
    playerPrompt: "think keyboard, {playerName}",
    answer: {
      display: 'Ctrl+S',
      acceptable: ['ctrl+s', 'control s', 'cmd+s', 'command s']
    }
  },
  {
    category: 'Excel',
    difficulty: 100,
    questionText: "What do you call the boxes in an Excel spreadsheet?",
    rangeText: "Basic Excel term",
    playerPrompt: "you know this, {playerName}",
    answer: {
      display: 'Cells',
      acceptable: ['cells', 'cell', 'boxes', 'squares']
    }
  },
  {
    category: 'Excel',
    difficulty: 100,
    questionText: "What's the default file extension for Excel?",
    rangeText: "Three letters",
    playerPrompt: "think file types, {playerName}",
    answer: {
      display: '.xlsx',
      acceptable: ['.xlsx', 'xlsx', '.xls', 'xls']
    }
  },
  {
    category: 'Excel',
    difficulty: 100,
    questionText: "What's the shortcut to create a new workbook?",
    rangeText: "Common shortcut",
    playerPrompt: "new file, {playerName}",
    answer: {
      display: 'Ctrl+N',
      acceptable: ['ctrl+n', 'control n', 'cmd+n', 'command n']
    }
  },

  // EXCEL - 200 points
  {
    category: 'Excel',
    difficulty: 200,
    questionText: "What's the maximum number of rows in an Excel worksheet?",
    rangeText: "Within 100,000",
    playerPrompt: "it's a lot, {playerName}",
    answer: {
      display: '1,048,576',
      acceptable: ['1048576', '1,048,576', 'about 1 million', '1 million rows']
    }
  },
  {
    category: 'Excel',
    difficulty: 200,
    questionText: "What function adds up a range of cells?",
    rangeText: "Common function",
    playerPrompt: "think math, {playerName}",
    answer: {
      display: 'SUM',
      acceptable: ['sum', 'sum()', 'sum function', '=sum']
    }
  },
  {
    category: 'Excel',
    difficulty: 200,
    questionText: "What's the shortcut to autofill down?",
    rangeText: "Two keys",
    playerPrompt: "think drag, {playerName}",
    answer: {
      display: 'Ctrl+D',
      acceptable: ['ctrl+d', 'control d', 'cmd+d', 'command d']
    }
  },
  {
    category: 'Excel',
    difficulty: 200,
    questionText: "What's the maximum number of columns in Excel?",
    rangeText: "Within 10",
    playerPrompt: "think letters, {playerName}",
    answer: {
      display: '16,384',
      acceptable: ['16384', '16,384', 'about 16k', 'XFD']
    }
  },

  // EXCEL - 300 points
  {
    category: 'Excel',
    difficulty: 300,
    questionText: "What's the formula to count non-empty cells?",
    rangeText: "Function name",
    playerPrompt: "think counting, {playerName}",
    answer: {
      display: 'COUNTA',
      acceptable: ['counta', 'counta()', 'counta function', '=counta']
    }
  },
  {
    category: 'Excel',
    difficulty: 300,
    questionText: "What's the maximum number of worksheets in a workbook?",
    rangeText: "Within 100",
    playerPrompt: "it's limited, {playerName}",
    answer: {
      display: '255',
      acceptable: ['255', 'two hundred fifty-five', '250-260', 'around 255']
    }
  },
  {
    category: 'Excel',
    difficulty: 300,
    questionText: "What's the shortcut to open the format cells dialog?",
    rangeText: "One key",
    playerPrompt: "think formatting, {playerName}",
    answer: {
      display: 'Ctrl+1',
      acceptable: ['ctrl+1', 'control 1', 'cmd+1', 'command 1']
    }
  },
  {
    category: 'Excel',
    difficulty: 300,
    questionText: "What function finds a value in a table?",
    rangeText: "Two words",
    playerPrompt: "think lookup, {playerName}",
    answer: {
      display: 'VLOOKUP',
      acceptable: ['vlookup', 'vlookup()', 'vlookup function', '=vlookup']
    }
  },

  // EXCEL - 400 points
  {
    category: 'Excel',
    difficulty: 400,
    questionText: "What's the maximum number of characters in a single cell?",
    rangeText: "Within 10,000",
    playerPrompt: "it's a lot, {playerName}",
    answer: {
      display: '32,767',
      acceptable: ['32767', '32,767', 'about 32k', 'around 32,000']
    }
  },
  {
    category: 'Excel',
    difficulty: 400,
    questionText: "What's the formula to extract text between two delimiters?",
    rangeText: "Function name",
    playerPrompt: "think text functions, {playerName}",
    answer: {
      display: 'MID',
      acceptable: ['mid', 'mid()', 'mid function', '=mid']
    }
  },
  {
    category: 'Excel',
    difficulty: 400,
    questionText: "What's the maximum number of array formulas in a worksheet?",
    rangeText: "Within 1,000",
    playerPrompt: "think limits, {playerName}",
    answer: {
      display: '65,472',
      acceptable: ['65472', '65,472', 'about 65k', 'around 65,000']
    }
  },
  {
    category: 'Excel',
    difficulty: 400,
    questionText: "What's the shortcut to toggle absolute/relative references?",
    rangeText: "One key",
    playerPrompt: "think dollar signs, {playerName}",
    answer: {
      display: 'F4',
      acceptable: ['f4', 'F4 key', 'function 4']
    }
  },

  // REALITY TV - 100 points
  {
    category: 'Reality TV',
    difficulty: 100,
    questionText: "What's the name of the show where people compete for roses?",
    rangeText: "Popular dating show",
    playerPrompt: "think romance, {playerName}",
    answer: {
      display: 'The Bachelor',
      acceptable: ['the bachelor', 'bachelor', 'bachelor show']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 100,
    questionText: "What network airs Survivor?",
    rangeText: "Three letters",
    playerPrompt: "think networks, {playerName}",
    answer: {
      display: 'CBS',
      acceptable: ['cbs', 'CBS network', 'Columbia Broadcasting System']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 100,
    questionText: "What's the catchphrase of The Real Housewives?",
    rangeText: "Two words",
    playerPrompt: "think drama, {playerName}",
    answer: {
      display: 'Whoop it up',
      acceptable: ['whoop it up', 'whoop', 'whoop whoop']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 100,
    questionText: "What show features a boardroom with Donald Trump?",
    rangeText: "Business show",
    playerPrompt: "think fired, {playerName}",
    answer: {
      display: 'The Apprentice',
      acceptable: ['the apprentice', 'apprentice', 'celebrity apprentice']
    }
  },

  // REALITY TV - 200 points
  {
    category: 'Reality TV',
    difficulty: 200,
    questionText: "How many seasons of The Bachelor have aired?",
    rangeText: "Within 5 seasons",
    playerPrompt: "think long-running, {playerName}",
    answer: {
      display: '28',
      acceptable: ['28', 'twenty-eight', '25-30', 'around 28']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 200,
    questionText: "What's the name of the island where Survivor is filmed?",
    rangeText: "Country name",
    playerPrompt: "think tropical, {playerName}",
    answer: {
      display: 'Fiji',
      acceptable: ['fiji', 'Fiji islands', 'fijian islands']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 200,
    questionText: "How many Real Housewives franchises are there?",
    rangeText: "Within 3",
    playerPrompt: "think cities, {playerName}",
    answer: {
      display: '11',
      acceptable: ['11', 'eleven', '10-12', 'around 11']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 200,
    questionText: "What's the prize money on The Amazing Race?",
    rangeText: "Within $100,000",
    playerPrompt: "think big money, {playerName}",
    answer: {
      display: '$1,000,000',
      acceptable: ['1 million', '$1,000,000', 'one million dollars', '1 mil']
    }
  },

  // REALITY TV - 300 points
  {
    category: 'Reality TV',
    difficulty: 300,
    questionText: "What's the name of the first winner of Survivor?",
    rangeText: "First name",
    playerPrompt: "think season 1, {playerName}",
    answer: {
      display: 'Richard',
      acceptable: ['richard', 'richard hatch', 'rich']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 300,
    questionText: "How many people start on a typical season of Big Brother?",
    rangeText: "Within 2",
    playerPrompt: "think houseguests, {playerName}",
    answer: {
      display: '16',
      acceptable: ['16', 'sixteen', '14-18', 'around 16']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 300,
    questionText: "What's the longest-running reality competition show?",
    rangeText: "Show name",
    playerPrompt: "think decades, {playerName}",
    answer: {
      display: 'Survivor',
      acceptable: ['survivor', 'survivor cbs', 'survivor show']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 300,
    questionText: "How many days does a typical Survivor season last?",
    rangeText: "Within 5 days",
    playerPrompt: "think filming, {playerName}",
    answer: {
      display: '39',
      acceptable: ['39', 'thirty-nine', '38-40', 'around 39']
    }
  },

  // REALITY TV - 400 points
  {
    category: 'Reality TV',
    difficulty: 400,
    questionText: "What's the name of the host of The Amazing Race?",
    rangeText: "Full name",
    playerPrompt: "think hosts, {playerName}",
    answer: {
      display: 'Phil Keoghan',
      acceptable: ['phil keoghan', 'phil', 'phil k', 'keoghan']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 400,
    questionText: "How many countries has The Amazing Race visited?",
    rangeText: "Within 20",
    playerPrompt: "think global, {playerName}",
    answer: {
      display: '90',
      acceptable: ['90', 'ninety', '85-95', 'around 90']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 400,
    questionText: "What's the record for most consecutive wins on Jeopardy?",
    rangeText: "Within 10",
    playerPrompt: "think champions, {playerName}",
    answer: {
      display: '74',
      acceptable: ['74', 'seventy-four', 'ken jennings', '74 games']
    }
  },
  {
    category: 'Reality TV',
    difficulty: 400,
    questionText: "How many seasons of The Real Housewives of New York have aired?",
    rangeText: "Within 2",
    playerPrompt: "think specific franchise, {playerName}",
    answer: {
      display: '14',
      acceptable: ['14', 'fourteen', '13-15', 'around 14']
    }
  },

  // SCI-FI - 100 points
  {
    category: 'Sci-Fi',
    difficulty: 100,
    questionText: "What's the name of the starship in Star Trek?",
    rangeText: "Ship name",
    playerPrompt: "think enterprise, {playerName}",
    answer: {
      display: 'Enterprise',
      acceptable: ['enterprise', 'uss enterprise', 'the enterprise']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 100,
    questionText: "What's the name of Luke Skywalker's father?",
    rangeText: "Character name",
    playerPrompt: "think star wars, {playerName}",
    answer: {
      display: 'Darth Vader',
      acceptable: ['darth vader', 'vader', 'anakin skywalker']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 100,
    questionText: "What's the name of the robot in Star Wars?",
    rangeText: "Two robots",
    playerPrompt: "think droids, {playerName}",
    answer: {
      display: 'R2-D2 or C-3PO',
      acceptable: ['r2-d2', 'c-3po', 'r2d2', 'c3po', 'both']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 100,
    questionText: "What's the name of the time machine in Back to the Future?",
    rangeText: "Vehicle type",
    playerPrompt: "think delorean, {playerName}",
    answer: {
      display: 'DeLorean',
      acceptable: ['delorean', 'delorean car', 'delorean dmc-12']
    }
  },

  // SCI-FI - 200 points
  {
    category: 'Sci-Fi',
    difficulty: 200,
    questionText: "How many Star Wars movies are in the original trilogy?",
    rangeText: "Number",
    playerPrompt: "think episodes, {playerName}",
    answer: {
      display: '3',
      acceptable: ['3', 'three', 'original 3', 'episodes 4-6']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 200,
    questionText: "What's the name of the planet in Dune?",
    rangeText: "Planet name",
    playerPrompt: "think desert, {playerName}",
    answer: {
      display: 'Arrakis',
      acceptable: ['arrakis', 'dune', 'arrakis planet']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 200,
    questionText: "What's the name of the AI in 2001: A Space Odyssey?",
    rangeText: "Computer name",
    playerPrompt: "think hal, {playerName}",
    answer: {
      display: 'HAL 9000',
      acceptable: ['hal 9000', 'hal', 'hal 9000 computer']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 200,
    questionText: "What's the name of the spaceship in The Expanse?",
    rangeText: "Ship name",
    playerPrompt: "think rocinante, {playerName}",
    answer: {
      display: 'Rocinante',
      acceptable: ['rocinante', 'the rocinante', 'roci']
    }
  },

  // SCI-FI - 300 points
  {
    category: 'Sci-Fi',
    difficulty: 300,
    questionText: "How many lights are there in the famous Star Trek episode?",
    rangeText: "Number",
    playerPrompt: "think picard, {playerName}",
    answer: {
      display: '4',
      acceptable: ['4', 'four', 'there are four lights', 'four lights']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 300,
    questionText: "What's the name of the time travel device in Doctor Who?",
    rangeText: "Box name",
    playerPrompt: "think blue box, {playerName}",
    answer: {
      display: 'TARDIS',
      acceptable: ['tardis', 'the tardis', 'time and relative dimension in space']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 300,
    questionText: "How many Star Trek series have aired?",
    rangeText: "Within 3",
    playerPrompt: "think all series, {playerName}",
    answer: {
      display: '11',
      acceptable: ['11', 'eleven', '10-12', 'around 11']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 300,
    questionText: "What's the name of the main character in The Matrix?",
    rangeText: "Character name",
    playerPrompt: "think neo, {playerName}",
    answer: {
      display: 'Neo',
      acceptable: ['neo', 'thomas anderson', 'the one']
    }
  },

  // SCI-FI - 400 points
  {
    category: 'Sci-Fi',
    difficulty: 400,
    questionText: "What's the name of the planet in The Hitchhiker's Guide to the Galaxy?",
    rangeText: "Planet name",
    playerPrompt: "think earth, {playerName}",
    answer: {
      display: 'Earth',
      acceptable: ['earth', 'mostly harmless', 'the earth']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 400,
    questionText: "How many Star Wars movies are in the Skywalker saga?",
    rangeText: "Number",
    playerPrompt: "think all episodes, {playerName}",
    answer: {
      display: '9',
      acceptable: ['9', 'nine', 'episodes 1-9', 'nine movies']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 400,
    questionText: "What's the name of the AI in Her?",
    rangeText: "AI name",
    playerPrompt: "think operating system, {playerName}",
    answer: {
      display: 'Samantha',
      acceptable: ['samantha', 'sam', 'samantha os']
    }
  },
  {
    category: 'Sci-Fi',
    difficulty: 400,
    questionText: "What's the answer to life, the universe, and everything?",
    rangeText: "Number",
    playerPrompt: "think hitchhiker, {playerName}",
    answer: {
      display: '42',
      acceptable: ['42', 'forty-two', 'the answer is 42']
    }
  },

  // POTTERY - 100 points
  {
    category: 'Pottery',
    difficulty: 100,
    questionText: "What's the name of the machine used to shape clay?",
    rangeText: "Machine name",
    playerPrompt: "think spinning, {playerName}",
    answer: {
      display: 'Potter\'s wheel',
      acceptable: ['potters wheel', 'wheel', 'pottery wheel', 'spinning wheel']
    }
  },
  {
    category: 'Pottery',
    difficulty: 100,
    questionText: "What temperature do you fire pottery at?",
    rangeText: "General range",
    playerPrompt: "think hot, {playerName}",
    answer: {
      display: '1000-1300°C',
      acceptable: ['1000-1300', 'around 1200', 'very hot', 'kiln temperature']
    }
  },
  {
    category: 'Pottery',
    difficulty: 100,
    questionText: "What's the name of the oven used to fire pottery?",
    rangeText: "Oven name",
    playerPrompt: "think kiln, {playerName}",
    answer: {
      display: 'Kiln',
      acceptable: ['kiln', 'pottery kiln', 'firing kiln']
    }
  },
  {
    category: 'Pottery',
    difficulty: 100,
    questionText: "What's the main ingredient in clay?",
    rangeText: "Material",
    playerPrompt: "think earth, {playerName}",
    answer: {
      display: 'Clay minerals',
      acceptable: ['clay', 'clay minerals', 'kaolin', 'earth']
    }
  },

  // POTTERY - 200 points
  {
    category: 'Pottery',
    difficulty: 200,
    questionText: "How long does it take to fire pottery in a kiln?",
    rangeText: "Within 4 hours",
    playerPrompt: "think firing time, {playerName}",
    answer: {
      display: '8-12 hours',
      acceptable: ['8-12 hours', 'around 10 hours', '8 to 12', '10 hours']
    }
  },
  {
    category: 'Pottery',
    difficulty: 200,
    questionText: "What's the name of the glaze technique using multiple colors?",
    rangeText: "Technique name",
    playerPrompt: "think colors, {playerName}",
    answer: {
      display: 'Majolica',
      acceptable: ['majolica', 'majolica technique', 'colorful glaze']
    }
  },
  {
    category: 'Pottery',
    difficulty: 200,
    questionText: "What's the ideal humidity for drying pottery?",
    rangeText: "Within 10%",
    playerPrompt: "think drying, {playerName}",
    answer: {
      display: '50-60%',
      acceptable: ['50-60%', 'around 55%', '50 to 60 percent']
    }
  },
  {
    category: 'Pottery',
    difficulty: 200,
    questionText: "How many times is pottery typically fired?",
    rangeText: "Number",
    playerPrompt: "think firing stages, {playerName}",
    answer: {
      display: '2',
      acceptable: ['2', 'two', 'bisque and glaze', 'twice']
    }
  },

  // POTTERY - 300 points
  {
    category: 'Pottery',
    difficulty: 300,
    questionText: "What's the name of the Japanese pottery technique?",
    rangeText: "Technique name",
    playerPrompt: "think japan, {playerName}",
    answer: {
      display: 'Raku',
      acceptable: ['raku', 'raku firing', 'raku technique']
    }
  },
  {
    category: 'Pottery',
    difficulty: 300,
    questionText: "What's the ideal thickness for pottery walls?",
    rangeText: "Within 2mm",
    playerPrompt: "think thickness, {playerName}",
    answer: {
      display: '3-5mm',
      acceptable: ['3-5mm', '3 to 5 millimeters', 'around 4mm', '4mm']
    }
  },
  {
    category: 'Pottery',
    difficulty: 300,
    questionText: "How many types of clay are commonly used?",
    rangeText: "Within 2",
    playerPrompt: "think clay types, {playerName}",
    answer: {
      display: '3',
      acceptable: ['3', 'three', 'earthenware stoneware porcelain', 'three types']
    }
  },
  {
    category: 'Pottery',
    difficulty: 300,
    questionText: "What's the name of the tool used to trim pottery?",
    rangeText: "Tool name",
    playerPrompt: "think trimming, {playerName}",
    answer: {
      display: 'Rib',
      acceptable: ['rib', 'pottery rib', 'trimming rib', 'rib tool']
    }
  },

  // POTTERY - 400 points
  {
    category: 'Pottery',
    difficulty: 400,
    questionText: "What's the ideal temperature for bisque firing?",
    rangeText: "Within 50°C",
    playerPrompt: "think first firing, {playerName}",
    answer: {
      display: '900-1000°C',
      acceptable: ['900-1000', 'around 950', '900 to 1000 celsius']
    }
  },
  {
    category: 'Pottery',
    difficulty: 400,
    questionText: "How long should pottery dry before bisque firing?",
    rangeText: "Within 2 days",
    playerPrompt: "think drying time, {playerName}",
    answer: {
      display: '1-2 weeks',
      acceptable: ['1-2 weeks', '7-14 days', 'around 10 days', 'two weeks']
    }
  },
  {
    category: 'Pottery',
    difficulty: 400,
    questionText: "What's the name of the crack that forms in glaze?",
    rangeText: "Crack name",
    playerPrompt: "think defects, {playerName}",
    answer: {
      display: 'Crazing',
      acceptable: ['crazing', 'crazing crack', 'glaze crazing']
    }
  },
  {
    category: 'Pottery',
    difficulty: 400,
    questionText: "What's the ideal cooling rate for pottery?",
    rangeText: "Within 50°C per hour",
    playerPrompt: "think cooling, {playerName}",
    answer: {
      display: '100-150°C per hour',
      acceptable: ['100-150 per hour', 'around 125', '100 to 150 celsius per hour']
    }
  },

  // WINE - 100 points
  {
    category: 'Wine',
    difficulty: 100,
    questionText: "What's the main ingredient in wine?",
    rangeText: "Fruit",
    playerPrompt: "think grapes, {playerName}",
    answer: {
      display: 'Grapes',
      acceptable: ['grapes', 'grape juice', 'fermented grapes']
    }
  },
  {
    category: 'Wine',
    difficulty: 100,
    questionText: "What's the name of the container wine is stored in?",
    rangeText: "Container name",
    playerPrompt: "think barrel, {playerName}",
    answer: {
      display: 'Barrel',
      acceptable: ['barrel', 'wine barrel', 'oak barrel', 'cask']
    }
  },
  {
    category: 'Wine',
    difficulty: 100,
    questionText: "What color is red wine made from?",
    rangeText: "Color",
    playerPrompt: "think grapes, {playerName}",
    answer: {
      display: 'Red grapes',
      acceptable: ['red grapes', 'red', 'dark grapes']
    }
  },
  {
    category: 'Wine',
    difficulty: 100,
    questionText: "What's the name of the process that makes wine?",
    rangeText: "Process name",
    playerPrompt: "think fermentation, {playerName}",
    answer: {
      display: 'Fermentation',
      acceptable: ['fermentation', 'fermenting', 'wine making']
    }
  },

  // WINE - 200 points
  {
    category: 'Wine',
    difficulty: 200,
    questionText: "How long does wine typically age in barrels?",
    rangeText: "Within 1 year",
    playerPrompt: "think aging, {playerName}",
    answer: {
      display: '1-3 years',
      acceptable: ['1-3 years', 'around 2 years', '1 to 3', '2 years']
    }
  },
  {
    category: 'Wine',
    difficulty: 200,
    questionText: "What's the ideal temperature for storing wine?",
    rangeText: "Within 5°F",
    playerPrompt: "think storage, {playerName}",
    answer: {
      display: '55°F',
      acceptable: ['55', '55 degrees', '50-60', 'around 55']
    }
  },
  {
    category: 'Wine',
    difficulty: 200,
    questionText: "How many wine regions are in France?",
    rangeText: "Within 5",
    playerPrompt: "think france, {playerName}",
    answer: {
      display: '11',
      acceptable: ['11', 'eleven', '10-12', 'around 11']
    }
  },
  {
    category: 'Wine',
    difficulty: 200,
    questionText: "What's the name of the glass shape for red wine?",
    rangeText: "Glass type",
    playerPrompt: "think glassware, {playerName}",
    answer: {
      display: 'Bordeaux glass',
      acceptable: ['bordeaux glass', 'red wine glass', 'large bowl glass']
    }
  },

  // WINE - 300 points
  {
    category: 'Wine',
    difficulty: 300,
    questionText: "What's the ideal humidity for wine storage?",
    rangeText: "Within 10%",
    playerPrompt: "think storage conditions, {playerName}",
    answer: {
      display: '60-70%',
      acceptable: ['60-70%', 'around 65%', '60 to 70 percent']
    }
  },
  {
    category: 'Wine',
    difficulty: 300,
    questionText: "How many grape varieties are used in Champagne?",
    rangeText: "Within 2",
    playerPrompt: "think champagne, {playerName}",
    answer: {
      display: '3',
      acceptable: ['3', 'three', 'chardonnay pinot noir pinot meunier', 'three grapes']
    }
  },
  {
    category: 'Wine',
    difficulty: 300,
    questionText: "What's the name of the sediment in wine?",
    rangeText: "Sediment name",
    playerPrompt: "think sediment, {playerName}",
    answer: {
      display: 'Lees',
      acceptable: ['lees', 'wine lees', 'sediment', 'dead yeast']
    }
  },
  {
    category: 'Wine',
    difficulty: 300,
    questionText: "How long can wine be stored after opening?",
    rangeText: "Within 2 days",
    playerPrompt: "think opened wine, {playerName}",
    answer: {
      display: '3-5 days',
      acceptable: ['3-5 days', 'around 4 days', '3 to 5', '4 days']
    }
  },

  // WINE - 400 points
  {
    category: 'Wine',
    difficulty: 400,
    questionText: "What's the ideal pH level for wine?",
    rangeText: "Within 0.5",
    playerPrompt: "think chemistry, {playerName}",
    answer: {
      display: '3.0-3.5',
      acceptable: ['3.0-3.5', 'around 3.3', '3 to 3.5', '3.3']
    }
  },
  {
    category: 'Wine',
    difficulty: 400,
    questionText: "How many bottles are in a standard case of wine?",
    rangeText: "Number",
    playerPrompt: "think cases, {playerName}",
    answer: {
      display: '12',
      acceptable: ['12', 'twelve', 'a dozen', '12 bottles']
    }
  },
  {
    category: 'Wine',
    difficulty: 400,
    questionText: "What's the name of the process of removing sediment?",
    rangeText: "Process name",
    playerPrompt: "think clarification, {playerName}",
    answer: {
      display: 'Racking',
      acceptable: ['racking', 'wine racking', 'sediment removal']
    }
  },
  {
    category: 'Wine',
    difficulty: 400,
    questionText: "What's the ideal serving temperature for white wine?",
    rangeText: "Within 5°F",
    playerPrompt: "think serving, {playerName}",
    answer: {
      display: '45-50°F',
      acceptable: ['45-50', 'around 47', '45 to 50 degrees', '47 degrees']
    }
  },

  // CONSPIRACY THEORIES - 100 points
  {
    category: 'Conspiracy Theories',
    difficulty: 100,
    questionText: "What's the name of the area where planes supposedly disappear?",
    rangeText: "Location name",
    playerPrompt: "think triangle, {playerName}",
    answer: {
      display: 'Bermuda Triangle',
      acceptable: ['bermuda triangle', 'bermuda', 'triangle']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 100,
    questionText: "What's the name of the moon landing conspiracy?",
    rangeText: "Conspiracy name",
    playerPrompt: "think moon, {playerName}",
    answer: {
      display: 'Moon landing hoax',
      acceptable: ['moon landing hoax', 'fake moon landing', 'moon hoax']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 100,
    questionText: "What's the name of the secret society?",
    rangeText: "Society name",
    playerPrompt: "think illuminati, {playerName}",
    answer: {
      display: 'Illuminati',
      acceptable: ['illuminati', 'the illuminati', 'illuminati society']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 100,
    questionText: "What's the name of the flat earth theory?",
    rangeText: "Theory name",
    playerPrompt: "think flat, {playerName}",
    answer: {
      display: 'Flat Earth',
      acceptable: ['flat earth', 'earth is flat', 'flat earth theory']
    }
  },

  // CONSPIRACY THEORIES - 200 points
  {
    category: 'Conspiracy Theories',
    difficulty: 200,
    questionText: "What's the name of the 9/11 conspiracy theory?",
    rangeText: "Theory name",
    playerPrompt: "think inside job, {playerName}",
    answer: {
      display: 'Inside job',
      acceptable: ['inside job', '9/11 inside job', 'controlled demolition']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 200,
    questionText: "What's the name of the lizard people theory?",
    rangeText: "Theory name",
    playerPrompt: "think reptiles, {playerName}",
    answer: {
      display: 'Reptilian conspiracy',
      acceptable: ['reptilian', 'lizard people', 'reptilian overlords']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 200,
    questionText: "What's the name of the chemtrails theory?",
    rangeText: "Theory name",
    playerPrompt: "think sky, {playerName}",
    answer: {
      display: 'Chemtrails',
      acceptable: ['chemtrails', 'chemical trails', 'sky spraying']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 200,
    questionText: "What's the name of the JFK assassination theory?",
    rangeText: "Theory name",
    playerPrompt: "think second shooter, {playerName}",
    answer: {
      display: 'Second shooter',
      acceptable: ['second shooter', 'multiple shooters', 'grassy knoll']
    }
  },

  // CONSPIRACY THEORIES - 300 points
  {
    category: 'Conspiracy Theories',
    difficulty: 300,
    questionText: "What's the name of the fake pandemic theory?",
    rangeText: "Theory name",
    playerPrompt: "think covid, {playerName}",
    answer: {
      display: 'Plandemic',
      acceptable: ['plandemic', 'fake pandemic', 'planned pandemic']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 300,
    questionText: "What's the name of the hollow earth theory?",
    rangeText: "Theory name",
    playerPrompt: "think hollow, {playerName}",
    answer: {
      display: 'Hollow Earth',
      acceptable: ['hollow earth', 'earth is hollow', 'hollow earth theory']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 300,
    questionText: "What's the name of the fake moon landing theory?",
    rangeText: "Theory name",
    playerPrompt: "think stanley kubrick, {playerName}",
    answer: {
      display: 'Kubrick directed it',
      acceptable: ['kubrick', 'stanley kubrick', 'kubrick directed moon landing']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 300,
    questionText: "What's the name of the bird drone theory?",
    rangeText: "Theory name",
    playerPrompt: "think birds, {playerName}",
    answer: {
      display: 'Birds aren\'t real',
      acceptable: ['birds arent real', 'bird drones', 'birds are government drones']
    }
  },

  // CONSPIRACY THEORIES - 400 points
  {
    category: 'Conspiracy Theories',
    difficulty: 400,
    questionText: "What's the name of the simulation theory?",
    rangeText: "Theory name",
    playerPrompt: "think matrix, {playerName}",
    answer: {
      display: 'Simulation hypothesis',
      acceptable: ['simulation hypothesis', 'we live in a simulation', 'matrix theory']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 400,
    questionText: "What's the name of the time travel conspiracy?",
    rangeText: "Theory name",
    playerPrompt: "think time, {playerName}",
    answer: {
      display: 'Time travel cover-up',
      acceptable: ['time travel', 'time travel conspiracy', 'chrononauts']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 400,
    questionText: "What's the name of the fake space theory?",
    rangeText: "Theory name",
    playerPrompt: "think nasa, {playerName}",
    answer: {
      display: 'NASA is fake',
      acceptable: ['nasa is fake', 'space is fake', 'fake space program']
    }
  },
  {
    category: 'Conspiracy Theories',
    difficulty: 400,
    questionText: "What's the name of the celebrity clone theory?",
    rangeText: "Theory name",
    playerPrompt: "think clones, {playerName}",
    answer: {
      display: 'Celebrity clones',
      acceptable: ['celebrity clones', 'clones', 'replaced celebrities']
    }
  },
];

// Helper function to get a question by category and difficulty
// Note: If category doesn't match, returns a fallback question
export function getQuestion(category: string, difficulty: number): Question | null {
  // Try exact match first
  let question = questions.find(
    q => q.category.toLowerCase() === category.toLowerCase() && q.difficulty === difficulty
  );
  
  // If no exact match, try to find any question with the same difficulty
  // This is a fallback for custom categories players might enter
  if (!question) {
    question = questions.find(q => q.difficulty === difficulty);
  }
  
  // If still no match, return null (shouldn't happen with our database)
  return question || null;
}

// Helper function to get all questions for a category
export function getCategoryQuestions(category: string): Question[] {
  return questions.filter(
    q => q.category.toLowerCase() === category.toLowerCase()
  );
}

// Helper function to format question text with player name
export function formatQuestionText(question: Question, playerName: string): string {
  return question.questionText.replace(/{playerName}/g, playerName);
}

// Helper function to format range text with player name
export function formatRangeText(question: Question, playerName: string): string {
  return question.rangeText.replace(/{playerName}/g, playerName);
}

// Helper function to format player prompt with player name
export function formatPlayerPrompt(question: Question, playerName: string): string {
  return question.playerPrompt.replace(/{playerName}/g, playerName);
}

