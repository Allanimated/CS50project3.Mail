document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  //compose mail handler
  document.querySelector('#compose-form').addEventListener('submit', send_mail);
  //email view 
  document.querySelector('#email-contents');
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-contents').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-contents').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get emails from the database
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    if (emails.length === 0) {
      const noEmailsMessage = document.createElement('div');
      noEmailsMessage.className = 'noEmailMessage'
      noEmailsMessage.textContent = 'Uuummmhh... looks like there are no emails here :(';
      document.querySelector('#emails-view').append(noEmailsMessage);
    } else {
      console.log(emails);
      // Rendering each mail in its own box
      emails.forEach(email => {
        const emailBox = document.createElement('div');
        emailBox.className='list-group-item'
        emailBox.innerHTML = `<h6>${email.sender}</h6><strong>${email.subject}</strong><br><p>${email.timestamp}</p>`;
        emailBox.addEventListener('click', () => {
          view_email(email.id)
        } );
        emailBox.addEventListener('click', ()=> {
          markEmailRead(email.id)
        });
        document.querySelector('#emails-view').append(emailBox);
        //change background color for read emails
        if (email.read === true) {
          emailBox.style.backgroundColor = 'aliceblue'
        } else {
          emailBox.style.backgroundColor = 'steelblue'
        }
      });
    }
  });

}
function send_mail(event) {
  event.preventDefault();

  // capture data from compose-email form fields
  const composeRecipients = document.querySelector('#compose-recipients').value;
  const composeSubject = document.querySelector('#compose-subject').value;
  const composeBody = document.querySelector('#compose-body').value;

  // pass data to back end for processing.
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: composeRecipients,
      subject: composeSubject,
      body: composeBody
    })
    
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    // redirect to sent mailbox
    load_mailbox('sent');
  });
}

function view_email (email_id) {
  //show email contents and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-contents').style.display = 'block';
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    // Print email
    console.log(email);

    // display email contents
    document.querySelector('#email-contents').innerHTML = `
      <div class="card">
        <div class="card-header" id="card-header">
        </div>
        <div class="card-body">
          from: <strong>${email.sender}</strong><p>${email.timestamp}</p>
          <hr>
          <h3 class="card-title">${email.subject}</h3>
          <p class="card-text">${email.body}</p>
          <a class="btn btn-outline-primary btn-rounded" id="reply">Reply</a>
        </div>
      </div>
   `
   //archive and unarchive emails
   const button = document.createElement('button');
   if (email.archived ==false) {
    button.innerHTML = 'Archive';
    button.className = 'btn btn-danger'
   } else {
    button.innerHTML = 'Unarchive';
    button.className = 'btn btn-warning';
   }
   button.addEventListener('click', function() {
    if (email.archived == false) {
      archive_email(email.id)
    } else {
      unarchive_email(email.id)
    }  
   });
   document.querySelector('#card-header').append(button);
   //disable archive button in sent mails
   const user_email = document.querySelector('#user-email').innerHTML;
   if (email.sender == user_email) {
    document.querySelector('#card-header').remove(button);
   }
   //replying to email
   document.querySelector('#reply').addEventListener('click', () => {
    compose_email();
    // fill out composition fields
    document.querySelector('#compose-recipients').value = email.sender;
    let subject = email.subject;
    if (subject.split(' ', 1)[0] !== 'RE:') {
      subject = 'RE: ' + subject
    }
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `||On ${email.timestamp}, ${email.sender} wrote: ${email.body}||`;
   });
  });
  
 
  
}function markEmailRead (email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}
function archive_email (email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  })
  //load inbox mailbox
  load_mailbox('inbox');
}

function unarchive_email (email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  })
  //load inbox mailbox
  load_mailbox('archive')
}
