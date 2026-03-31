export interface TestStep {
  id: string
  action: string
  type: 'send' | 'click' | 'wait' | 'check'
  expect: string
}

export interface TestScenario {
  id: string
  name: string
  description: string
  steps: TestStep[]
}

export interface TestCategory {
  id: string
  name: string
  emoji: string
  description: string
  scenarios: TestScenario[]
}

export const testScripts: TestCategory[] = [
  // ─────────────────────────────────────────────────
  // Category 1: Der Ideale Kunde
  // ─────────────────────────────────────────────────
  {
    id: 'ideal',
    name: 'Der Ideale Kunde',
    emoji: '🎯',
    description: 'Perfect flow - customer follows every step',
    scenarios: [
      {
        id: 'ideal-single-part',
        name: '1.1 Single Part - Happy Path',
        description: 'VIN + part + customer number + select + order',
        steps: [
          { id: 'i1-1', type: 'send', action: 'Hallo', expect: 'Greets in German, introduces as parts assistant, asks what part is needed' },
          { id: 'i1-2', type: 'send', action: 'Ich brauche eine Bremsscheibe, FIN: WBADEXTESTSTUB001', expect: 'Acknowledges VIN + part, sends customer number buttons (CustNum_yes / CustNum_no)' },
          { id: 'i1-3', type: 'click', action: 'CustNum_yes', expect: 'Asks to enter customer number ("Bitte geben Sie Ihre Kundennummer ein")' },
          { id: 'i1-4', type: 'send', action: '12345', expect: 'Validates number. If valid: proceeds to search. If invalid: re-asks' },
          { id: 'i1-5', type: 'wait', action: 'Wait for search results', expect: 'Shows up to 3 part results with prices/brands as PartSelect_ buttons' },
          { id: 'i1-6', type: 'click', action: 'PartSelect_ (first option)', expect: 'Confirms part added to cart, shows cart summary + order buttons (CartConf_yes/no/more_parts)' },
          { id: 'i1-7', type: 'click', action: 'CartConf_yes', expect: 'Processes order, confirms order placed, session ends' },
          { id: 'i1-8', type: 'check', action: 'Verify session', expect: 'Session stage = COMPLETED, Cart status = COMPLETED' },
        ],
      },
      {
        id: 'ideal-no-custnr',
        name: '1.2 Single Part - No Customer Number',
        description: 'Customer clicks "No" on customer number',
        steps: [
          { id: 'i2-1', type: 'send', action: 'Hallo, ich suche einen Ölfilter für meinen BMW. FIN: WBADEXTESTSTUB003', expect: 'Greets, acknowledges, sends customer number buttons' },
          { id: 'i2-2', type: 'click', action: 'CustNum_no', expect: 'Acknowledges no number, proceeds directly to parts search' },
          { id: 'i2-3', type: 'wait', action: 'Wait for search results', expect: 'Shows part results with PartSelect_ buttons' },
          { id: 'i2-4', type: 'click', action: 'PartSelect_ (any option)', expect: 'Adds to cart, shows cart + order buttons' },
          { id: 'i2-5', type: 'click', action: 'CartConf_yes', expect: 'Completes order, confirmation message' },
          { id: 'i2-6', type: 'check', action: 'Verify', expect: 'Customer number state = ABSENT. Bot never asked for number again' },
        ],
      },
      {
        id: 'ideal-multi-queue',
        name: '1.3 Multiple Parts - Queue Flow',
        description: '3 parts at once, queue through all',
        steps: [
          { id: 'i3-1', type: 'send', action: 'Hi, ich brauche Bremsscheiben, Ölfilter und Zündkerzen. Meine FIN ist WVWDEXTESTSTUB001', expect: 'Acknowledges all 3 parts, asks for customer number' },
          { id: 'i3-2', type: 'click', action: 'CustNum_no', expect: 'Sets queue with 3 items, starts searching first part (Bremsscheiben)' },
          { id: 'i3-3', type: 'wait', action: 'Wait for Bremsscheiben results', expect: 'Shows results for Bremsscheiben with part buttons' },
          { id: 'i3-4', type: 'click', action: 'PartSelect_ (pick one)', expect: 'Adds to cart, shows "Nächstes Teil" button (AiBtn_next_part)' },
          { id: 'i3-5', type: 'click', action: 'AiBtn_next_part', expect: 'Searches Ölfilter automatically, shows results' },
          { id: 'i3-6', type: 'click', action: 'PartSelect_ (pick one)', expect: 'Adds to cart, shows "Nächstes Teil" button (1 more in queue)' },
          { id: 'i3-7', type: 'click', action: 'AiBtn_next_part', expect: 'Searches Zündkerzen, shows results' },
          { id: 'i3-8', type: 'click', action: 'PartSelect_ (pick one)', expect: 'Adds to cart, queue empty. Shows full cart + order buttons' },
          { id: 'i3-9', type: 'click', action: 'CartConf_yes', expect: 'Completes order with all 3 items' },
          { id: 'i3-10', type: 'check', action: 'Verify', expect: 'Cart has 3 items. Queue shows all 3 as completed' },
        ],
      },
      {
        id: 'ideal-oem',
        name: '1.4 OEM Number Search (No VIN)',
        description: 'OEM number directly - no VIN required',
        steps: [
          { id: 'i4-1', type: 'send', action: 'Ich suche die OEM-Nummer 8P0941004K', expect: 'Recognizes as OEM number, asks for customer number. Does NOT ask for VIN!' },
          { id: 'i4-2', type: 'click', action: 'CustNum_no', expect: 'Searches directly by OEM number, shows results' },
          { id: 'i4-3', type: 'click', action: 'PartSelect_ (pick one)', expect: 'Adds to cart, shows cart + order buttons' },
          { id: 'i4-4', type: 'click', action: 'CartConf_no', expect: 'Acknowledges cancellation, asks if they need anything else' },
          { id: 'i4-5', type: 'check', action: 'Verify', expect: 'Bot never asked for VIN. search_type = oem_number' },
        ],
      },
      {
        id: 'ideal-mixed-types',
        name: '1.5 Mixed Search Types (Name + OEM)',
        description: 'Part name + OEM number in same session',
        steps: [
          { id: 'i5-1', type: 'send', action: 'Ich brauche einen Ölfilter und die OEM-Nummer A0024272006. FIN: WDBDEXTESTSTUB001', expect: 'Queues both items. Ölfilter as part_name, OEM as oem_number. Asks for customer number' },
          { id: 'i5-2', type: 'click', action: 'CustNum_no', expect: 'Starts searching first item with correct search_type' },
          { id: 'i5-3', type: 'wait', action: 'Proceed through queue', expect: 'First search uses VIN + part_name. Second uses oem_number without VIN' },
          { id: 'i5-4', type: 'check', action: 'Verify search types', expect: 'Each search used the correct search_type per item' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 2: Der Neugierige
  // ─────────────────────────────────────────────────
  {
    id: 'curious',
    name: 'Der Neugierige',
    emoji: '🤔',
    description: 'Asks questions mid-flow, still orders',
    scenarios: [
      {
        id: 'curious-faq-mid',
        name: '2.1 FAQ Mid-Search',
        description: 'Asks about opening hours during customer number flow',
        steps: [
          { id: 'c1-1', type: 'send', action: 'Hey, ich brauche Bremsbeläge für mein Auto', expect: 'Greets, asks for VIN' },
          { id: 'c1-2', type: 'send', action: 'WAUDEXTESTSTUB001', expect: 'Acknowledges VIN (Audi), asks for customer number' },
          { id: 'c1-3', type: 'click', action: 'CustNum_yes', expect: 'Asks for number' },
          { id: 'c1-4', type: 'send', action: 'Moment mal, wann habt ihr eigentlich geöffnet?', expect: 'Answers opening hours (Mo-Fr 9-18, Sa 9-16, So closed) via FAQ. Does NOT lose search context' },
          { id: 'c1-5', type: 'send', action: 'Ok danke! Meine Kundennummer ist 12345', expect: 'Continues with customer number validation, then searches Bremsbeläge' },
          { id: 'c1-6', type: 'wait', action: 'Wait for results', expect: 'Shows brake pad results' },
          { id: 'c1-7', type: 'check', action: 'Context preserved', expect: 'Bot remembered VIN, part request, and customer number flow after FAQ detour' },
        ],
      },
      {
        id: 'curious-part-question',
        name: '2.2 Part Question During Search',
        description: 'Technical question about a part mid-flow',
        steps: [
          { id: 'c2-1', type: 'send', action: 'FIN: WVWDEXTESTSTUB002, ich brauche einen Zahnriemen', expect: 'Acknowledges, asks for customer number' },
          { id: 'c2-2', type: 'click', action: 'CustNum_no', expect: 'Searches for Zahnriemen' },
          { id: 'c2-3', type: 'wait', action: 'Wait for results', expect: 'Shows results with buttons' },
          { id: 'c2-4', type: 'send', action: 'Wie oft sollte man den Zahnriemen eigentlich wechseln?', expect: 'Answers via car_knowledge tool. Does NOT lose part selection context' },
          { id: 'c2-5', type: 'send', action: 'Ok gut, dann nehme ich den ersten', expect: 'Interprets as selecting first offered part. Adds to cart' },
          { id: 'c2-6', type: 'check', action: 'Verify', expect: 'car_knowledge tool used. Offered parts still valid and selectable after question' },
        ],
      },
      {
        id: 'curious-cheaper',
        name: '2.3 Cheaper Alternative',
        description: 'Sees results, asks for cheaper options',
        steps: [
          { id: 'c3-1', type: 'send', action: 'FIN: WBADEXTESTSTUB001, Bremsscheibe', expect: 'Asks for customer number' },
          { id: 'c3-2', type: 'click', action: 'CustNum_no', expect: 'Searches, shows results' },
          { id: 'c3-3', type: 'wait', action: 'Wait for results', expect: '3 part options shown' },
          { id: 'c3-4', type: 'send', action: 'Gibt es was Günstigeres?', expect: 'Uses offer_parts with selection_mode "cheaper", shows cheaper alternatives' },
          { id: 'c3-5', type: 'click', action: 'PartSelect_ (pick one)', expect: 'Adds to cart' },
          { id: 'c3-6', type: 'check', action: 'Verify', expect: 'offer_parts called with "cheaper" mode. New suggestions have lower prices' },
        ],
      },
      {
        id: 'curious-brand',
        name: '2.4 Specific Brand Request',
        description: 'Customer wants a specific brand (e.g., Bosch)',
        steps: [
          { id: 'c4-1', type: 'send', action: 'Bremsscheibe für WAUDEXTESTSTUB002, Kundennummer hab ich nicht', expect: 'Handles all info: VIN, part, no customer number. Skips buttons, searches directly' },
          { id: 'c4-2', type: 'wait', action: 'Wait for results', expect: 'Shows results' },
          { id: 'c4-3', type: 'send', action: 'Habt ihr das von Bosch?', expect: 'Uses offer_parts with brand_filter "Bosch". Shows Bosch results or says none available' },
          { id: 'c4-4', type: 'check', action: 'Verify', expect: 'offer_parts called with brand filter. Results (if any) are from Bosch' },
        ],
      },
      {
        id: 'curious-cart-modify',
        name: '2.5 Cart Modification',
        description: 'Change quantity, remove items mid-order',
        steps: [
          { id: 'c5-1', type: 'send', action: 'FIN: WDBDEXTESTSTUB002, Bremsscheibe und Ölfilter', expect: 'Queues 2 parts, asks for customer number' },
          { id: 'c5-2', type: 'click', action: 'CustNum_no', expect: 'Searches first part' },
          { id: 'c5-3', type: 'wait', action: 'Select parts through queue, add both to cart', expect: 'Cart with 2 items' },
          { id: 'c5-4', type: 'send', action: 'Ich brauche 2 Bremsscheiben statt 1', expect: 'Uses update_cart_quantity, shows updated cart' },
          { id: 'c5-5', type: 'send', action: 'Den Ölfilter brauche ich doch nicht', expect: 'Uses remove_from_cart, shows updated cart' },
          { id: 'c5-6', type: 'click', action: 'CartConf_yes', expect: 'Orders only the 2 Bremsscheiben' },
          { id: 'c5-7', type: 'check', action: 'Verify', expect: 'Cart correctly reflects qty change + removal. Final order has correct items' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 3: Der Planlose
  // ─────────────────────────────────────────────────
  {
    id: 'clueless',
    name: 'Der Planlose',
    emoji: '😅',
    description: 'No idea what to do, needs guidance',
    scenarios: [
      {
        id: 'clueless-no-vin',
        name: '3.1 No VIN, No Idea',
        description: "Doesn't know what a VIN is",
        steps: [
          { id: 'cl1-1', type: 'send', action: 'Hallo ich brauche ein Teil für mein Auto', expect: 'Asks what part and for VIN' },
          { id: 'cl1-2', type: 'send', action: 'Bremsscheiben', expect: 'Acknowledges part name, asks for VIN specifically' },
          { id: 'cl1-3', type: 'send', action: 'Was ist eine FIN?', expect: 'Explains VIN: where to find it (Fahrzeugschein, Türrahmen, etc.)' },
          { id: 'cl1-4', type: 'send', action: 'Ah ok, hier: ZFADEXTESTSTUB001', expect: 'Proceeds with search flow (customer number, then search)' },
          { id: 'cl1-5', type: 'check', action: 'Verify', expect: 'Bot patiently explained VIN without losing context of part request' },
        ],
      },
      {
        id: 'clueless-non-searchable',
        name: '3.2 Non-Searchable Item',
        description: 'Asks for tires (non-searchable category)',
        steps: [
          { id: 'cl2-1', type: 'send', action: 'Ich brauche neue Reifen', expect: 'Recognizes as non-searchable. Sends BUTTONS (not text list): "Kfz-Teil suchen" + "Mitarbeiter"' },
          { id: 'cl2-2', type: 'click', action: 'Mitarbeiter', expect: 'Handoff to human agent' },
          { id: 'cl2-3', type: 'check', action: 'Verify', expect: 'Bot used send_buttons tool (NOT text). Recognized "Reifen" from non_searchable_categories' },
        ],
      },
      {
        id: 'clueless-mixed-searchable',
        name: '3.3 Mix Searchable + Non-Searchable',
        description: 'Both searchable and non-searchable items',
        steps: [
          { id: 'cl3-1', type: 'send', action: 'Ich brauche Bremsscheiben und neue Reifen', expect: 'Identifies Reifen as non-searchable, Bremsscheiben as searchable. Sends buttons: "Weiter suchen" + "Mitarbeiter"' },
          { id: 'cl3-2', type: 'click', action: 'Weiter suchen', expect: 'Continues with only Bremsscheiben, asks for VIN' },
          { id: 'cl3-3', type: 'send', action: 'WBADEXTESTSTUB001', expect: 'Proceeds to customer number then search' },
          { id: 'cl3-4', type: 'check', action: 'Verify', expect: 'Non-searchable item filtered out. Only searchable items in queue' },
        ],
      },
      {
        id: 'clueless-3-strike',
        name: '3.4 3-Strike Failure (Handoff)',
        description: 'Part not found 3 times -> automatic handoff',
        steps: [
          { id: 'cl4-1', type: 'send', action: 'FIN: WB1DEXTESTSTUB001, Dachantenne', expect: 'Asks for customer number' },
          { id: 'cl4-2', type: 'click', action: 'CustNum_no', expect: 'Searches for Dachantenne - likely 404' },
          { id: 'cl4-3', type: 'wait', action: 'Wait for failure #1', expect: '"Not found" message. partsNotFoundCount = 1' },
          { id: 'cl4-4', type: 'send', action: 'Dachantenne Haifisch', expect: 'Searches again - likely fails' },
          { id: 'cl4-5', type: 'wait', action: 'Wait for failure #2', expect: '"Not found" again. partsNotFoundCount = 2' },
          { id: 'cl4-6', type: 'send', action: 'Antenne', expect: 'Searches again - likely fails' },
          { id: 'cl4-7', type: 'wait', action: 'Wait for failure #3', expect: 'After 3rd failure: automatic handoff_to_human' },
          { id: 'cl4-8', type: 'check', action: 'Verify', expect: 'After exactly 3 failures, handoff triggered. current_handler = human' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 4: Der Wechselhafte
  // ─────────────────────────────────────────────────
  {
    id: 'indecisive',
    name: 'Der Wechselhafte',
    emoji: '🔄',
    description: 'Changes VIN, changes mind, restarts',
    scenarios: [
      {
        id: 'indecisive-vin-before',
        name: '4.1 VIN Change Before Search',
        description: 'Changes VIN before search begins',
        steps: [
          { id: 'v1-1', type: 'send', action: 'FIN: WBADEXTESTSTUB001, brauche Bremsscheibe', expect: 'Acknowledges, asks for customer number' },
          { id: 'v1-2', type: 'click', action: 'CustNum_no', expect: 'Starts search with BMW VIN' },
          { id: 'v1-3', type: 'send', action: 'Warte, falsche FIN! Die richtige ist WVWDEXTESTSTUB001', expect: 'Acknowledges VIN change, re-searches with new VIN (VW)' },
          { id: 'v1-4', type: 'wait', action: 'Wait for results', expect: 'Results should be for VW, NOT BMW' },
          { id: 'v1-5', type: 'check', action: 'Verify', expect: 'Session VIN updated. Results match second VIN. No error' },
        ],
      },
      {
        id: 'indecisive-vin-after',
        name: '4.2 VIN Change After Results',
        description: 'Sees results, then says "wrong car"',
        steps: [
          { id: 'v2-1', type: 'send', action: 'FIN: WAUDEXTESTSTUB001, Ölfilter', expect: 'Customer number flow' },
          { id: 'v2-2', type: 'click', action: 'CustNum_no', expect: 'Searches, shows results' },
          { id: 'v2-3', type: 'wait', action: 'Wait for Ölfilter results', expect: 'Results shown for Audi' },
          { id: 'v2-4', type: 'send', action: 'Oh das war das falsche Auto. Die FIN ist eigentlich WDBDEXTESTSTUB001', expect: 'Accepts new VIN, searches Ölfilter again with new VIN' },
          { id: 'v2-5', type: 'wait', action: 'Wait for new results', expect: 'New results for Mercedes (not Audi)' },
          { id: 'v2-6', type: 'check', action: 'Verify', expect: 'Old results discarded. New search with new VIN. Customer number NOT re-asked' },
        ],
      },
      {
        id: 'indecisive-vin-mid-queue',
        name: '4.3 VIN Change Mid-Queue',
        description: 'Different VIN for second part in queue',
        steps: [
          { id: 'v3-1', type: 'send', action: 'FIN: WBADEXTESTSTUB001, Bremsscheibe und Ölfilter', expect: 'Queue 2 parts, customer number flow' },
          { id: 'v3-2', type: 'click', action: 'CustNum_no', expect: 'Searches Bremsscheibe' },
          { id: 'v3-3', type: 'wait', action: 'Select a part, add to cart', expect: '"Nächstes Teil" button shown' },
          { id: 'v3-4', type: 'send', action: 'Den Ölfilter brauche ich für ein anderes Auto. FIN: WVWDEXTESTSTUB002', expect: 'Updates queue/VIN for remaining items, searches Ölfilter with new VIN' },
          { id: 'v3-5', type: 'wait', action: 'Wait for results', expect: 'Results for VW Ölfilter (not BMW)' },
          { id: 'v3-6', type: 'check', action: 'Verify', expect: 'First part stays in cart (BMW). Second searched with new VIN. Multi-VIN handled' },
        ],
      },
      {
        id: 'indecisive-change-part',
        name: '4.4 Change Part After Results',
        description: 'Decides they want a different part',
        steps: [
          { id: 'v4-1', type: 'send', action: 'FIN: W0LDEXTESTSTUB001, Bremsscheibe', expect: 'Customer number flow, search' },
          { id: 'v4-2', type: 'click', action: 'CustNum_no', expect: 'Shows Bremsscheibe results' },
          { id: 'v4-3', type: 'wait', action: 'Wait for results', expect: 'Bremsscheibe results shown' },
          { id: 'v4-4', type: 'send', action: 'Eigentlich brauche ich doch Bremsbeläge, nicht Bremsscheiben', expect: 'Searches Bremsbeläge instead (same VIN, new search)' },
          { id: 'v4-5', type: 'wait', action: 'Wait for new results', expect: 'Bremsbeläge results shown' },
          { id: 'v4-6', type: 'check', action: 'Verify', expect: 'No confusion. New search replaces old results cleanly' },
        ],
      },
      {
        id: 'indecisive-cancel-restart',
        name: '4.5 Cancel and Start Over',
        description: 'Cancels everything, starts fresh',
        steps: [
          { id: 'v5-1', type: 'send', action: '(Go through flow, add 2 items to cart)', expect: 'Cart with 2 items' },
          { id: 'v5-2', type: 'send', action: 'Ich möchte alles abbrechen und von vorne anfangen', expect: 'Uses clear_cart, acknowledges restart' },
          { id: 'v5-3', type: 'send', action: 'Ok, neue Suche. FIN: VF1DEXTESTSTUB001, Stoßdämpfer', expect: 'Fresh search with new VIN, normal flow' },
          { id: 'v5-4', type: 'check', action: 'Verify', expect: 'Cart cleared. Bot restarts smoothly. Old data gone' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 5: Der Unerfahrene
  // ─────────────────────────────────────────────────
  {
    id: 'needs-human',
    name: 'Der Unerfahrene',
    emoji: '🆘',
    description: 'Needs human help immediately',
    scenarios: [
      {
        id: 'human-immediate',
        name: '5.1 Immediate Human Request',
        description: 'Wants human directly, not the bot',
        steps: [
          { id: 'h1-1', type: 'send', action: 'Kann ich bitte mit einem Mitarbeiter sprechen?', expect: 'Uses handoff_to_human, confirms transfer. If outside hours: mentions when support reopens' },
          { id: 'h1-2', type: 'check', action: 'Verify', expect: 'Immediate handoff. current_handler = human' },
        ],
      },
      {
        id: 'human-order-status',
        name: '5.2 Order Status Inquiry',
        description: 'Asks about an existing order/delivery',
        steps: [
          { id: 'h2-1', type: 'send', action: 'Wo ist meine Bestellung? Ich habe vor 3 Tagen bestellt', expect: 'Recognizes as order status question. Either FAQ answer about delivery or handoff to human. Does NOT start parts search' },
          { id: 'h2-2', type: 'check', action: 'Verify', expect: 'Bot does not start a parts search. Handles gracefully' },
        ],
      },
      {
        id: 'human-complaint',
        name: '5.3 Complaint',
        description: 'Wrong part received, unhappy customer',
        steps: [
          { id: 'h3-1', type: 'send', action: 'Ich habe das falsche Teil bekommen! Die Bremsscheibe passt nicht!', expect: 'Recognizes as complaint. Uses handoff_to_human with appropriate reason' },
          { id: 'h3-2', type: 'check', action: 'Verify', expect: 'Handoff triggered. Reason mentions complaint/wrong part' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 6: Der Natürliche
  // ─────────────────────────────────────────────────
  {
    id: 'natural',
    name: 'Der Natürliche',
    emoji: '💬',
    description: 'Natural conversation, info across messages',
    scenarios: [
      {
        id: 'natural-spread',
        name: '6.1 Info Spread Across Messages',
        description: 'Gives info piece by piece',
        steps: [
          { id: 'n1-1', type: 'send', action: 'Hallo', expect: 'Greets, asks what is needed' },
          { id: 'n1-2', type: 'send', action: 'Bremsscheiben', expect: 'Acknowledges, asks for VIN' },
          { id: 'n1-3', type: 'send', action: 'Hier die FIN', expect: 'Asks for the actual VIN (customer said "here it is" but didn\'t send it)' },
          { id: 'n1-4', type: 'send', action: 'WBADEXTESTSTUB001', expect: 'NOW proceeds to customer number flow' },
          { id: 'n1-5', type: 'click', action: 'CustNum_yes', expect: 'Asks for number' },
          { id: 'n1-6', type: 'send', action: 'Die ist 67890', expect: 'Validates customer number, proceeds to search' },
          { id: 'n1-7', type: 'check', action: 'Verify', expect: 'Bot handles separate messages without confusion' },
        ],
      },
      {
        id: 'natural-typos',
        name: '6.2 Typos and Slang',
        description: 'Misspells everything, casual language',
        steps: [
          { id: 'n2-1', type: 'send', action: 'yo bruche bremsscheibe', expect: 'Understands despite typo ("bruche" = "brauche"), asks for VIN' },
          { id: 'n2-2', type: 'send', action: 'WVWDEXTESTSTUB003', expect: 'Proceeds normally' },
          { id: 'n2-3', type: 'click', action: 'CustNum_no', expect: 'Searches - search_term properly spelled, original_term preserves typo' },
          { id: 'n2-4', type: 'check', action: 'Verify', expect: 'Bot handles typos gracefully. Corrected search_term, preserved original_term' },
        ],
      },
      {
        id: 'natural-206-position',
        name: '6.3 Position Clarification (206)',
        description: 'Search returns left/right variants',
        steps: [
          { id: 'n3-1', type: 'send', action: 'FIN: WBADEXTESTSTUB001, Scheinwerfer', expect: 'Customer number flow, then search' },
          { id: 'n3-2', type: 'click', action: 'CustNum_no', expect: 'Search returns 206 with variants (links/rechts). Shows options to customer' },
          { id: 'n3-3', type: 'send', action: 'Links', expect: 'Re-searches with specific OEM from 206 response (oem parameter, skips API)' },
          { id: 'n3-4', type: 'wait', action: 'Wait for results', expect: 'Shows inventory results for left headlight' },
          { id: 'n3-5', type: 'check', action: 'Verify', expect: 'Bot presented options clearly. Second search used oem parameter' },
        ],
      },
      {
        id: 'natural-position-upfront',
        name: '6.4 Position in Request',
        description: 'Specifies position from the start',
        steps: [
          { id: 'n4-1', type: 'send', action: 'FIN: WAUDEXTESTSTUB001, vordere Bremsscheibe links', expect: 'Customer number flow' },
          { id: 'n4-2', type: 'click', action: 'CustNum_no', expect: 'Searches with search_term: "Bremsscheibe", position: "front-left"' },
          { id: 'n4-3', type: 'check', action: 'Verify', expect: 'Position extracted correctly. search_term does NOT contain "vordere" or "links"' },
        ],
      },
      {
        id: 'natural-goodbye',
        name: '6.5 Browse and Leave',
        description: 'Browses but decides not to buy',
        steps: [
          { id: 'n5-1', type: 'send', action: '(Go through search flow, see results)', expect: 'Results shown' },
          { id: 'n5-2', type: 'send', action: 'Ne danke, ich schau mich nochmal woanders um. Tschüss!', expect: 'Calls end_session, says goodbye politely' },
          { id: 'n5-3', type: 'check', action: 'Verify', expect: 'Session ends cleanly. end_session called' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 7: Stresstest
  // ─────────────────────────────────────────────────
  {
    id: 'stress',
    name: 'Stresstest',
    emoji: '⚡',
    description: 'Edge cases and weird inputs',
    scenarios: [
      {
        id: 'stress-multi-oem',
        name: '7.1 Multiple OEMs at Once',
        description: '3 OEM numbers in one message',
        steps: [
          { id: 's1-1', type: 'send', action: 'Ich suche diese OEM-Nummern: 8P0941004K, A0024272006 und 1K0615301M', expect: 'Queues all 3 as oem_number. Asks for customer number. NOT for VIN!' },
          { id: 's1-2', type: 'click', action: 'CustNum_no', expect: 'Searches first OEM number' },
          { id: 's1-3', type: 'wait', action: 'Proceed through queue', expect: 'Each OEM searched without VIN' },
          { id: 's1-4', type: 'check', action: 'Verify', expect: 'All 3 queued with search_type oem_number. No VIN requested' },
        ],
      },
      {
        id: 'stress-text-select',
        name: '7.2 Text Selection (No Button)',
        description: 'Types "the first one" instead of clicking button',
        steps: [
          { id: 's2-1', type: 'send', action: '(Get to part results with 3 options)', expect: 'Buttons shown' },
          { id: 's2-2', type: 'send', action: 'Ich nehme den ersten', expect: 'AI interprets and calls add_to_cart with the first offered part' },
          { id: 's2-3', type: 'check', action: 'Verify', expect: 'Bot understands natural language part selection, not just buttons' },
        ],
      },
      {
        id: 'stress-more-parts',
        name: '7.3 Add More After Cart',
        description: 'Uses CartConf_more_parts to keep shopping',
        steps: [
          { id: 's3-1', type: 'send', action: '(Add a part to cart, see order buttons)', expect: 'Cart + CartConf buttons shown' },
          { id: 's3-2', type: 'click', action: 'CartConf_more_parts', expect: '"Gerne! Welches Teil suchen Sie noch?"' },
          { id: 's3-3', type: 'send', action: 'Ölfilter', expect: 'Continues search for Ölfilter (same VIN, no re-entry needed)' },
          { id: 's3-4', type: 'wait', action: 'Select, add to cart', expect: 'Updated cart with 2 items, new order buttons' },
          { id: 's3-5', type: 'check', action: 'Verify', expect: 'VIN and customer number persisted. Second search smooth' },
        ],
      },
      {
        id: 'stress-invalid-vin',
        name: '7.4 Invalid VIN',
        description: 'Sends something that is not a VIN',
        steps: [
          { id: 's4-1', type: 'send', action: 'FIN: ABC123, Bremsscheibe', expect: 'Recognizes invalid VIN format, asks for correct VIN' },
          { id: 's4-2', type: 'send', action: 'WBADEXTESTSTUB001', expect: 'Proceeds normally with valid VIN' },
          { id: 's4-3', type: 'check', action: 'Verify', expect: 'Bot did not attempt search with invalid VIN' },
        ],
      },
      {
        id: 'stress-off-topic',
        name: '7.5 Off-Topic 3-Strike',
        description: '3 off-topic messages -> handoff',
        steps: [
          { id: 's5-1', type: 'send', action: 'Erzähl mir einen Witz', expect: 'flag_off_topic called. Redirects to parts topic. offTopicCount = 1' },
          { id: 's5-2', type: 'send', action: 'Was ist das Wetter heute?', expect: 'flag_off_topic again. offTopicCount = 2' },
          { id: 's5-3', type: 'send', action: 'Sag mir die Lottozahlen', expect: 'flag_off_topic, offTopicCount = 3 -> handoff_to_human' },
          { id: 's5-4', type: 'check', action: 'Verify', expect: 'After 3 off-topic messages, automatic handoff. Bot stayed polite' },
        ],
      },
      {
        id: 'stress-delivery-faq',
        name: '7.6 FAQ Before Ordering',
        description: 'Asks about delivery/returns first',
        steps: [
          { id: 's6-1', type: 'send', action: 'Hallo, bevor ich bestelle - wie läuft das mit der Lieferung?', expect: 'Uses check_faq, answers about delivery' },
          { id: 's6-2', type: 'send', action: 'Und wie ist eure Rückgabepolitik?', expect: 'Uses check_faq, answers about returns' },
          { id: 's6-3', type: 'send', action: 'Super, dann suche ich jetzt. FIN: WF0DEXTESTSTUB001, Bremssattel', expect: 'Transitions to normal search flow smoothly' },
          { id: 's6-4', type: 'check', action: 'Verify', expect: 'FAQ answers relevant. Smooth transition to search' },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────
  // Category 8: Multi-Session
  // ─────────────────────────────────────────────────
  {
    id: 'multi-session',
    name: 'Multi-Session',
    emoji: '🔁',
    description: 'Returning customer, saved vehicles',
    scenarios: [
      {
        id: 'multi-returning',
        name: '8.1 Returning Customer',
        description: 'Previous session exists, comes back for more',
        steps: [
          { id: 'm1-1', type: 'send', action: '(Complete a full order flow with VIN WBADEXTESTSTUB001)', expect: 'Order completed, session ends' },
          { id: 'm1-2', type: 'send', action: '(Start new conversation with same phone number)', expect: 'New session created' },
          { id: 'm1-3', type: 'send', action: 'Hallo, ich brauche nochmal was', expect: 'Recognizes returning customer, mentions/offers saved vehicle from previous session' },
          { id: 'm1-4', type: 'send', action: 'Ja, gleiches Auto. Bremsbeläge diesmal', expect: 'Uses saved VIN, skips VIN collection' },
          { id: 'm1-5', type: 'check', action: 'Verify', expect: 'CustomerPreferences has saved vehicle. Bot offers to reuse. No redundant VIN request' },
        ],
      },
    ],
  },
]
