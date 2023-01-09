export function CreateHTMLElement(loginPin) {
  return `
        <div>
      <p>Hello! We just want to make sure everything is in order before you start using this platform. To set up your account, please enter the code below.</p>
      <h2 style="color:#7A9CC6;">${loginPin}</h2>
      </div>`;
}
