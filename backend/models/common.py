"""
공통 모델 유틸리티
"""

from bson import ObjectId


class PyObjectId(str):
    """
    MongoDB ObjectId를 Pydantic에서 사용하기 위한 커스텀 타입
    """

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


def camel_case_alias_generator(field_name: str) -> str:
    """snake_case를 camelCase로 변환하는 alias generator"""
    words = field_name.split("_")
    return words[0] + "".join(word.capitalize() for word in words[1:])
