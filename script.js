document.addEventListener('DOMContentLoaded', function() {
  // Existing code for toggling the sidebar and form submission
  document.getElementById('toggle-sidebar').addEventListener('click', function() {
      document.getElementById('sidebar').classList.toggle('minimized');
      document.getElementById('content').classList.toggle('shifted');    
  });

  document.getElementById('menuForm').addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);
      fetch('/addMenuItem', {
          method: 'POST',
          body: formData
      })
      .then(response => response.text())
      .then(data => alert(data))
      .catch(error => console.error('Error:', error));
  });


  // Call any additional initialization functions here if needed
});
document.addEventListener('DOMContentLoaded', function() {
  var elements = document.querySelectorAll('.typing-animation');
  elements.forEach(function(element) {
    element.classList.add('typing-animation');
  });
});
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
      document.getElementById('loading-screen').style.display = 'none';
  }, 500); 

  displayNoOrdersMessage('past');

  // Orders button setup
  document.getElementById('pastOrdersBtn').addEventListener('click', function() {
      displayNoOrdersMessage('past');
  });
  
  document.getElementById('liveOrdersBtn').addEventListener('click', function() {
      displayNoOrdersMessage('live');
  });

    // Display no orders message initially and setup button events
    displayNoOrdersMessage('past');
    document.getElementById('pastOrdersBtn').addEventListener('click', function() {
        displayNoOrdersMessage('past');
    });
    document.getElementById('liveOrdersBtn').addEventListener('click', function() {
        displayNoOrdersMessage('live');
    });

    makeTablesInteractive();
    
});


const header = document.querySelector('.header-content h2');
if (header) {
  setTimeout(() => {
    header.classList.add('animate-hover-effect');
    header.addEventListener('animationend', () => {
      header.classList.remove('animate-hover-effect');
    });
  }, 750); 
}
// Initialize clickable menu items
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', function() {
    const url = this.getAttribute('data-href');
    if (url) {
      window.location.href = url;
    }
  });
});


function displayNoOrdersMessage(type) {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = ''; // Clear existing content

  let message = '';
  let iconClass = '';

  if (type === 'past') {
      message = 'No past orders';
      iconClass = 'fas fa-history'; // Example icon class
  } else if (type === 'live') {
      message = 'No live orders';
      iconClass = 'fas fa-broadcast-tower'; // Example icon class
  }

  const noDataHtml = `
      <tr class="no-data">
          <td colspan="5">
              <i class="${iconClass} faded-icon"></i>
              <span>${message}</span>
          </td>
      </tr>
  `;

  tbody.innerHTML = noDataHtml;
}

// Initially display no past orders
displayNoOrdersMessage('past');
document.querySelectorAll('.table').forEach(table => {
  table.addEventListener('click', function() {
      this.classList.toggle('occupied');
  });
});

function makeTablesInteractive() {
  document.querySelectorAll('.table-cell').forEach((cell, index) => {
      cell.dataset.state = 'unassigned';
      cell.addEventListener('mouseenter', handleMouseEnter);
      cell.addEventListener('mouseleave', handleMouseLeave);
      cell.addEventListener('click', toggleState);

      // Remove the following line if you want to remove numbers from tables
      cell.textContent = index + 1; // Assigning initial table numbers
  });
}

function handleDragStart(event) {
  event.dataTransfer.setData('text/plain', event.target.id);
}


function showAssignPrompt(event) {
  const cell = event.target;
  if (!cell.classList.contains('occupied')) {
      cell.dataset.originalText = cell.textContent; // Save the original text
      cell.textContent = 'Assign Table?';
      cell.classList.add('assign-table-prompt');
  }
}

function hideAssignPrompt(event) {
  const cell = event.target;
  if (!cell.classList.contains('occupied')) {
      cell.textContent = cell.dataset.originalText; // Restore the original text
      cell.classList.remove('assign-table-prompt');
    }
}

function toggleOccupied(event) {
  const cell = event.target;
  cell.classList.toggle('occupied');
  cell.textContent = cell.classList.contains('occupied') ? 'Occupied' : cell.dataset.originalText;
}

function makeTablesInteractive() {
  document.querySelectorAll('.table-cell').forEach(cell => {
      cell.dataset.state = 'unassigned'; // Initial state
      cell.addEventListener('mouseenter', handleMouseEnter);
      cell.addEventListener('mouseleave', handleMouseLeave);
      cell.addEventListener('click', toggleState);
  });
}

function handleMouseEnter(event) {
  const cell = event.target;
  if (cell.dataset.state === 'unassigned') {
      cell.textContent = 'Assign Table?';
  } else if (cell.dataset.state === 'assigned') {
      cell.textContent = 'Occupied?';
  }
}

function handleMouseLeave(event) {
  const cell = event.target;
  if (cell.dataset.state === 'unassigned') {
      cell.textContent = ''; // Clear text when unassigned
  } else if (cell.dataset.state === 'assigned') {
      cell.textContent = 'Table';
  }
}

function toggleState(event) {
  const cell = event.target;
  if (cell.dataset.state === 'unassigned') {
      cell.dataset.state = 'assigned';
      cell.textContent = 'Table';
      cell.style.backgroundColor = 'green';
      addResetButton(cell);
  } else if (cell.dataset.state === 'assigned') {
      cell.dataset.state = 'occupied';
      cell.textContent = 'Occupied';
      cell.style.backgroundColor = 'red';
      // Ensure reset button is available in 'occupied' state
      if (!cell.querySelector('.reset-button')) {
          addResetButton(cell);
      }
  }
}

function addResetButton(cell) {
  if (!cell.querySelector('.reset-button')) { // Check if reset button already exists
      const resetBtn = document.createElement('i');
      resetBtn.classList.add('fas', 'fa-times', 'reset-button');
      resetBtn.onclick = function() {
          resetTable(cell);
      };
      cell.appendChild(resetBtn);
  }
}

function resetTable(cell) {
  cell.dataset.state = 'unassigned';
  cell.textContent = ''; 
  cell.style.backgroundColor = '';
  const resetBtn = cell.querySelector('.reset-button');
  if (resetBtn) {
      cell.removeChild(resetBtn);
  }
}


