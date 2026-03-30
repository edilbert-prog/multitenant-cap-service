// let Host='https://dev.3framesailabs.com'
// let Host='https://sirobilt.ai'
let Host=window.location.origin
export const HostConfig={
    BASE_URL:`/cognito/api`,
    Domain:Host,
    socketURL: 'http://localhost:4005',
    LLMHost:Host
}
