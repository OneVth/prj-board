"""
Custom Exception Classes for Better Error Handling
"""

from fastapi import HTTPException, status


class NotFoundException(HTTPException):
    """
    Resource not found exception

    Usage:
        raise NotFoundException("Post", post_id)
    """

    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with id {resource_id} not found",
        )


class UnauthorizedException(HTTPException):
    """
    Unauthorized access exception

    Usage:
        raise UnauthorizedException()
        raise UnauthorizedException("Invalid credentials")
    """

    def __init__(self, detail: str = "Unauthorized access"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenException(HTTPException):
    """
    Forbidden access exception (authenticated but not authorized)

    Usage:
        raise ForbiddenException("You can only edit your own posts")
    """

    def __init__(self, detail: str = "Forbidden - Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


class BadRequestException(HTTPException):
    """
    Bad request exception (invalid input)

    Usage:
        raise BadRequestException("Invalid ID format")
    """

    def __init__(self, detail: str = "Bad request - Invalid input"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class ConflictException(HTTPException):
    """
    Conflict exception (duplicate resource)

    Usage:
        raise ConflictException("User with this email already exists")
    """

    def __init__(self, detail: str = "Conflict - Resource already exists"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )
