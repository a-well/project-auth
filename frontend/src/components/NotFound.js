import React from 'react'
import { Link } from 'react-router-dom'

const NotFound = () => {
    return (
        <>
          <Link to='/login'> GO TO LOGIN</Link>
          <h1>Not found</h1>
        </>
    )
}

export default NotFound