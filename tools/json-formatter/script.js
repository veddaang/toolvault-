/**
 * JSON Formatter & Validator
 * All processing runs client-side. No data is sent anywhere.
 */

var lastFormattedJSON = '';
var lastAction = 'format'; // 'format' or 'minify'

function getTabSize() {
  return parseInt(document.getElementById('tab-size').value, 10) || 2;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Syntax-highlight a single line of formatted JSON.
 * Works on already-escaped HTML strings.
 */
function highlightLine(line) {
  // Highlight keys: "key":
  line = line.replace(
    /(&quot;)((?:[^&]|&(?!quot;))*)(&quot;)\s*:/g,
    '<span class="json-key">&quot;$2&quot;</span>:'
  );

  // Highlight string values: "value" (not followed by :)
  line = line.replace(
    /(&quot;)((?:[^&]|&(?!quot;))*)(&quot;)/g,
    '<span class="json-string">&quot;$2&quot;</span>'
  );

  // Highlight numbers
  line = line.replace(
    /:\s*(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
    function(match, num) {
      return ': <span class="json-number">' + num + '</span>';
    }
  );
  // Numbers in arrays (after [ or ,)
  line = line.replace(
    /([\[,]\s*)(-?\d+\.?\d*(?:[eE][+-]?\d+)?)/g,
    function(match, prefix, num) {
      return prefix + '<span class="json-number">' + num + '</span>';
    }
  );

  // Highlight booleans
  line = line.replace(
    /\b(true|false)\b/g,
    '<span class="json-boolean">$1</span>'
  );

  // Highlight null
  line = line.replace(
    /\bnull\b/g,
    '<span class="json-null">null</span>'
  );

  // Highlight brackets
  line = line.replace(
    /([{}\[\]])/g,
    '<span class="json-bracket">$1</span>'
  );

  return line;
}

function showStatus(isValid, errorMsg, content) {
  var statusBar = document.getElementById('status-bar');
  statusBar.style.display = 'flex';

  var badge = document.getElementById('validation-badge');
  var errorEl = document.getElementById('error-message');
  var charCount = document.getElementById('char-count');
  var lineCount = document.getElementById('line-count');

  if (isValid) {
    badge.innerHTML = '<span class="badge badge-success">Valid JSON</span>';
    errorEl.textContent = '';
  } else {
    badge.innerHTML = '<span class="badge badge-error">Invalid JSON</span>';
    errorEl.textContent = errorMsg || '';
  }

  if (content) {
    charCount.textContent = content.length.toLocaleString() + ' chars';
    lineCount.textContent = content.split('\n').length.toLocaleString() + ' lines';
  } else {
    charCount.textContent = '';
    lineCount.textContent = '';
  }
}

function renderOutput(formatted) {
  var outputBox = document.getElementById('output-box');
  var outputEl = document.getElementById('json-output');
  outputBox.style.display = 'block';

  var lines = formatted.split('\n');
  var html = '';

  for (var i = 0; i < lines.length; i++) {
    var escaped = escapeHTML(lines[i]);
    var highlighted = highlightLine(escaped);
    html += '<span class="line">' + highlighted + '</span>\n';
  }

  outputEl.innerHTML = html;
  lastFormattedJSON = formatted;
}

function formatJSON() {
  var input = document.getElementById('json-input').value.trim();

  if (!input) {
    document.getElementById('status-bar').style.display = 'none';
    document.getElementById('output-box').style.display = 'none';
    return;
  }

  try {
    var parsed = JSON.parse(input);
    var tabSize = getTabSize();
    var formatted = JSON.stringify(parsed, null, tabSize);

    showStatus(true, '', formatted);
    renderOutput(formatted);
    lastAction = 'format';
  } catch (e) {
    showStatus(false, e.message, input);
    document.getElementById('output-box').style.display = 'none';
  }
}

function minifyJSON() {
  var input = document.getElementById('json-input').value.trim();

  if (!input) {
    document.getElementById('status-bar').style.display = 'none';
    document.getElementById('output-box').style.display = 'none';
    return;
  }

  try {
    var parsed = JSON.parse(input);
    var minified = JSON.stringify(parsed);

    showStatus(true, '', minified);
    renderOutput(minified);
    lastAction = 'minify';
  } catch (e) {
    showStatus(false, e.message, input);
    document.getElementById('output-box').style.display = 'none';
  }
}

function validateOnly() {
  var input = document.getElementById('json-input').value.trim();

  if (!input) {
    document.getElementById('status-bar').style.display = 'none';
    return;
  }

  try {
    JSON.parse(input);
    showStatus(true, '', input);
  } catch (e) {
    showStatus(false, e.message, input);
  }
}

function reformat() {
  if (lastAction === 'format') {
    formatJSON();
  }
}

function copyOutput() {
  if (!lastFormattedJSON) {
    return;
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(lastFormattedJSON).then(function() {
      showCopyFeedback();
    });
  } else {
    // Fallback
    var textarea = document.createElement('textarea');
    textarea.value = lastFormattedJSON;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback();
  }
}

function showCopyFeedback() {
  var btn = document.querySelector('[onclick="copyOutput()"]');
  if (btn) {
    var original = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.background = 'var(--green-bg)';
    btn.style.color = 'var(--green)';
    btn.style.borderColor = 'var(--green-border)';
    setTimeout(function() {
      btn.textContent = original;
      btn.style.background = '';
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 1500);
  }
}

function clearAll() {
  document.getElementById('json-input').value = '';
  document.getElementById('status-bar').style.display = 'none';
  document.getElementById('output-box').style.display = 'none';
  lastFormattedJSON = '';
}

function loadSample(type) {
  var samples = {
    simple: '{"name":"ToolVault","version":"1.0","isActive":true,"tools":3}',
    nested: '{"company":{"name":"ToolVault","founded":2026,"location":{"country":"India","city":"Mumbai"}},"products":[{"name":"D2C Calculator","category":"finance","free":true},{"name":"GST Calculator","category":"finance","free":true},{"name":"JSON Formatter","category":"developer","free":true}],"stats":{"users":null,"rating":4.8}}',
    array: '[{"id":1,"name":"Alice","email":"alice@example.com","active":true},{"id":2,"name":"Bob","email":"bob@example.com","active":false},{"id":3,"name":"Charlie","email":"charlie@example.com","active":true}]'
  };

  var input = document.getElementById('json-input');
  input.value = samples[type] || samples.simple;
  formatJSON();
}

// Allow Ctrl+Enter to format
document.addEventListener('DOMContentLoaded', function() {
  var input = document.getElementById('json-input');
  if (input) {
    input.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formatJSON();
      }
    });
  }
});
