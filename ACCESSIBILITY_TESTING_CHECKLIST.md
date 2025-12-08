# Accessibility Testing Checklist

This checklist should be used to manually verify the accessibility features of the Clinical Review Scheduler application.

## ✅ Automated Testing Status

- [x] 190 automated tests passing
- [x] 29 accessibility-specific tests
- [x] ARIA live regions tested
- [x] Keyboard navigation hooks tested
- [x] Focus trap functionality tested

---

## 🎹 Keyboard Navigation Testing

### Global Keyboard Shortcuts
- [ ] **Ctrl+Z / Cmd+Z**: Undo works in schedule grid
- [ ] **Ctrl+Y / Cmd+Y**: Redo works in schedule grid
- [ ] **Ctrl+Shift+Z / Cmd+Shift+Z**: Alternative redo works
- [ ] **Ctrl+S / Cmd+S**: Save works (prevents browser save dialog)
- [ ] **Escape**: Closes modals and dialogs

### Tab Navigation
- [ ] Tab moves focus forward through all interactive elements
- [ ] Shift+Tab moves focus backward
- [ ] Focus order is logical (top to bottom, left to right)
- [ ] All interactive elements are reachable via Tab
- [ ] No keyboard traps (except intentional modal traps)

### Focus Indicators
- [ ] All focused elements have visible outline (2px blue)
- [ ] Focus indicators are clearly visible on all backgrounds
- [ ] Focus indicators have sufficient contrast
- [ ] Focus indicators don't obscure content

### Modal/Dialog Navigation
- [ ] Tab cycles through modal elements only (focus trap works)
- [ ] Shift+Tab cycles backward within modal
- [ ] Escape closes modal
- [ ] Focus returns to triggering element when modal closes
- [ ] First element in modal receives focus on open

### Schedule Grid Navigation
- [ ] Tab moves between grid cells
- [ ] Enter/Space activates cells (assign/unassign)
- [ ] Grid cells are keyboard accessible
- [ ] Entity selection dialogs are keyboard accessible
- [ ] All assignment actions can be performed via keyboard

---

## 🔊 Screen Reader Testing

### Test with NVDA (Windows) or VoiceOver (macOS)

#### Page Structure
- [ ] Page title is announced
- [ ] Headings are properly announced (h1, h2, h3)
- [ ] Landmarks are identified (header, main, navigation)
- [ ] Skip link is available and functional

#### Interactive Elements
- [ ] All buttons have descriptive labels
- [ ] All form inputs have associated labels
- [ ] Links have descriptive text
- [ ] Icons are hidden from screen readers (aria-hidden)

#### Dynamic Content
- [ ] Auto-save status changes are announced
- [ ] Conflict/validation messages are announced
- [ ] Toast notifications are announced
- [ ] Loading states are announced

#### ARIA Attributes
- [ ] Grid cells have appropriate role="gridcell"
- [ ] Table has role="grid" and aria-label
- [ ] Buttons have aria-pressed for toggle states
- [ ] Dialogs have role="dialog" and aria-label
- [ ] Live regions have appropriate aria-live values

#### Form Validation
- [ ] Error messages are announced
- [ ] Required fields are identified
- [ ] Field instructions are announced
- [ ] Success messages are announced

---

## 🎨 Visual Testing

### Color Contrast
- [ ] Normal text has 4.5:1 contrast ratio minimum
- [ ] Large text has 3:1 contrast ratio minimum
- [ ] Interactive elements have sufficient contrast
- [ ] Focus indicators have sufficient contrast
- [ ] Error messages have sufficient contrast

### Zoom Testing (200%)
- [ ] Page is usable at 200% zoom
- [ ] No horizontal scrolling at 200% zoom
- [ ] All content remains visible
- [ ] Interactive elements remain clickable
- [ ] Text doesn't overlap

### Dark Mode
- [ ] All features work in dark mode
- [ ] Contrast ratios maintained in dark mode
- [ ] Focus indicators visible in dark mode
- [ ] All colors have dark mode equivalents

---

## 🖱️ Mouse/Touch Testing

### Hover States
- [ ] All interactive elements have hover states
- [ ] Hover states are visually distinct
- [ ] Tooltips appear on hover where appropriate

### Click Targets
- [ ] All click targets are at least 44x44 pixels
- [ ] Buttons are easy to click
- [ ] Links are easy to click
- [ ] Grid cells are easy to click

---

## 📱 Responsive Testing

### Mobile Devices
- [ ] Application works on mobile devices
- [ ] Touch targets are appropriately sized
- [ ] No horizontal scrolling on mobile
- [ ] All features accessible on mobile

### Tablet Devices
- [ ] Application works on tablets
- [ ] Layout adapts appropriately
- [ ] Touch interactions work correctly

---

## 🌐 Browser Testing

Test in the following browsers:

### Chrome/Edge
- [ ] All keyboard shortcuts work
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] No console errors

### Firefox
- [ ] All keyboard shortcuts work
- [ ] Focus indicators visible
- [ ] Screen reader compatible
- [ ] No console errors

### Safari
- [ ] All keyboard shortcuts work
- [ ] Focus indicators visible
- [ ] VoiceOver compatible
- [ ] No console errors

---

## 🔍 Specific Feature Testing

### Login Page
- [ ] Form inputs have labels
- [ ] Error messages are accessible
- [ ] Submit button is keyboard accessible
- [ ] Focus management works correctly

### Supervisor Dashboard
- [ ] Schedule list is keyboard navigable
- [ ] Create/edit buttons are accessible
- [ ] All actions have keyboard shortcuts
- [ ] Status indicators are announced

### Schedule Grid
- [ ] Grid is keyboard navigable
- [ ] Cell states are announced (assigned/unassigned)
- [ ] Entity selection is keyboard accessible
- [ ] Undo/redo works via keyboard
- [ ] Save works via keyboard

### Employee Management
- [ ] Add/edit forms are accessible
- [ ] All inputs have labels
- [ ] Validation errors are announced
- [ ] Archive action is keyboard accessible

### Entity Management
- [ ] Add/edit forms are accessible
- [ ] All inputs have labels
- [ ] Delete confirmation is accessible
- [ ] All actions keyboard accessible

### User View (Public)
- [ ] Published schedule is readable
- [ ] Grid is navigable (read-only)
- [ ] Login link is accessible
- [ ] Theme toggle is accessible

---

## 📋 WCAG 2.1 Level AA Compliance

### Perceivable
- [ ] 1.1.1 Non-text Content (images have alt text)
- [ ] 1.3.1 Info and Relationships (semantic HTML)
- [ ] 1.4.3 Contrast (Minimum) (4.5:1 for normal text)
- [ ] 1.4.4 Resize text (200% zoom works)
- [ ] 1.4.10 Reflow (no horizontal scroll at 200%)
- [ ] 1.4.11 Non-text Contrast (UI components 3:1)

### Operable
- [ ] 2.1.1 Keyboard (all functionality via keyboard)
- [ ] 2.1.2 No Keyboard Trap (can navigate away)
- [ ] 2.4.3 Focus Order (logical order)
- [ ] 2.4.7 Focus Visible (visible indicators)
- [ ] 2.5.5 Target Size (44x44 minimum)

### Understandable
- [ ] 3.1.1 Language of Page (lang attribute set)
- [ ] 3.2.1 On Focus (no unexpected changes)
- [ ] 3.2.2 On Input (no unexpected changes)
- [ ] 3.3.1 Error Identification (errors identified)
- [ ] 3.3.2 Labels or Instructions (inputs labeled)

### Robust
- [ ] 4.1.2 Name, Role, Value (ARIA attributes)
- [ ] 4.1.3 Status Messages (live regions)

---

## 🐛 Known Issues / Limitations

Document any accessibility issues found during testing:

1. **Issue**: [Description]
   - **Severity**: Critical / High / Medium / Low
   - **Impact**: [Who is affected]
   - **Workaround**: [If available]
   - **Status**: Open / In Progress / Fixed

---

## ✅ Sign-off

### Tester Information
- **Name**: ___________________________
- **Date**: ___________________________
- **Browser**: _________________________
- **Screen Reader**: ___________________
- **Operating System**: ________________

### Results
- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Medium/low issues documented
- [ ] Application meets WCAG 2.1 AA standards
- [ ] Approved for production

### Notes
_______________________________________
_______________________________________
_______________________________________

---

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [NVDA Download](https://www.nvaccess.org/download/)
- [Accessibility Insights](https://accessibilityinsights.io/)

---

## 🔄 Continuous Testing

This checklist should be used:
- Before each major release
- After significant UI changes
- When new features are added
- Quarterly as part of maintenance

Last Updated: December 8, 2025
