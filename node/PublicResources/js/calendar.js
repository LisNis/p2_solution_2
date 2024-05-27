const header = document.querySelector('.calendar h3');
const dates = document.querySelector('.dates');
const prevBtn = document.querySelector('#prev');
const nextBtn = document.querySelector('#next');
const newEventModal = document.getElementById('newEventModal');
const backDrop = document.getElementById('modalBackDrop');

const titleInput = document.getElementById('todo-title');
const cancelBtn = document.getElementById('cancel-button');
const addBtn = document.getElementById('add-button');
const listContainer = document.getElementById('list-container');

let nav = 0;
let clicked = null;
let events = [];

const weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

function openModal(date) {
    clicked = date;
    newEventModal.style.display = 'block';
    backDrop.style.display = 'block';
}

function closeModal() {
    newEventModal.style.display = 'none';
    backDrop.style.display = 'none';
    titleInput.value = '';
    clicked = null;
}

// vigtig function (impl.), render calendar med alle dage 
function renderCalendar() {
    const newDate = new Date();

    if (nav !== 0) {
        newDate.setMonth(new Date().getMonth() + nav);
    }

    const day = newDate.getDate();
    const month = newDate.getMonth();
    const year = newDate.getFullYear();

    // which year, which month, the first day
    const firstDayofMonth = new Date(year, month, 1);
    // which year, the next month, the last day of the previous month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // first day of the month, based on location, so month/day/year
    const dateString = firstDayofMonth.toLocaleDateString('en-us', {
        // Long: Monday, short: Mon, Numeric: 1
        weekday: 'long', 
        year: 'numeric', 
        month: "numeric",
        day: 'numeric'
    });

    // only want to get the first element, the weekday
    const extraDays = weekdays.indexOf(dateString.split(', ')[0]);
    console.log(extraDays);


    header.textContent = `${newDate.toLocaleDateString('en-us', { month: 'long'})} ${year}`;
    dates.innerHTML = '';

    for (let i = 1; i <= extraDays + daysInMonth; i++) {
        const daySquare = document.createElement('div');
        daySquare.classList.add('day');

        const dayString = `${month + 1}/${i - extraDays}/${year}`;

        if (i > extraDays) {
            daySquare.innerText = i - extraDays;
            daySquare.setAttribute('data-day', i - extraDays);
            daySquare.setAttribute('data-month', month);
            daySquare.setAttribute('data-year', year);

            // highlight current day
            if (i - extraDays === day && nav === 0) {
                daySquare.id = 'currentDay';
            }

            daySquare.addEventListener('click', () => openModal(dayString));
        } else {
            daySquare.classList.add('extra');
        }

        dates.appendChild(daySquare);
    }

    fetchEvents(); // Fetch and render events
}

function buttons() {
    nextBtn.addEventListener('click', () => {
        nav++;
        renderCalendar();
    });

    prevBtn.addEventListener('click', () => {
        nav--;
        renderCalendar();
    });
}

buttons();
renderCalendar();

cancelBtn.addEventListener('click', closeModal);

addBtn.addEventListener('click', function () {
    const eventTitle = titleInput.value;
    const eventDate = clicked;

    if (eventTitle) {
        const newEvent = {
            title: eventTitle,
            date: eventDate,
        };

        fetch('/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newEvent)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(data => {
                console.log(data); // Log the server response
                alert('Event added successfully');
                fetchEvents(); // Refresh events list
                closeModal();
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert('There was an error adding the event');
            });
    }
});

function fetchEvents() {
    fetch('/events')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched events:', data); // Debugging log
            renderEvents(data);
        })
        .catch(error => {
            console.error('Error fetching events:', error);
        });
}


function renderEvents(events) {
    dates.querySelectorAll('.day').forEach(day => {
        const dayEvents = day.querySelectorAll('.event');
        dayEvents.forEach(eventElement => eventElement.remove());
    });

    events.forEach(event => {
        // Highlight events on calendar
        dates.querySelectorAll('.day').forEach(day => {
            const dayDate = new Date(day.getAttribute('data-year'), day.getAttribute('data-month'), day.getAttribute('data-day'));
            const eventDate = new Date(event.date);

            if (
                eventDate.getDate() === dayDate.getDate() &&
                eventDate.getMonth() === dayDate.getMonth() &&
                eventDate.getFullYear() === dayDate.getFullYear()
            ) {
                // not duplicated in calendar
                if (!day.querySelector(`.event[data-id="${event.date}"]`)) {
                    const calendarEventElement = createEventElement(event, true);
                    calendarEventElement.setAttribute('data-id', event.date); // Add a data-id to identify the event
                    day.appendChild(calendarEventElement);
                }
            }
        });
    });
}


function createEventElement(event, forCalendar = false) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';

    const eventTitle = document.createElement('h3');
    eventTitle.textContent = event.title;
    eventElement.appendChild(eventTitle);

    const eventDate = document.createElement('p');
    eventDate.textContent = new Date(event.date).toLocaleDateString();
    eventElement.appendChild(eventDate);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.id = 'deleteEvent';
    deleteButton.addEventListener('click', () => {
        deleteEvent(event);
    });
    eventElement.appendChild(deleteButton);
    
    return eventElement;
}


function deleteEvent(eventToDelete) {
    fetch(`/events/${encodeURIComponent(eventToDelete.date)}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventToDelete)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            console.log(data); // Log the server response
            alert('Event deleted successfully');
            fetchEvents(); // Refresh events list
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            alert('There was an error deleting the event');
        });
}
