import os
import requests
from supabase import create_client, Client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
PUBLIC_API_KEY = os.getenv("PUBLIC_DATA_DECODING_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_and_upsert_subsidies():
    url = f"http://apis.data.go.kr/1360000/SubsidiesService/getWelfareList?serviceKey={PUBLIC_API_KEY}&pageNo=1&numOfRows=100&type=json"
    try:
        res = requests.get(url, timeout=10)
        data = res.json()
        items = data.get('response', {}).get('body', {}).get('items', [])
        
        for item in items:
            record = {
                "service_id": item.get('servId'),
                "title": item.get('servNm', '지원금'),
                "category": "지원금",
                "amount": item.get('alrmJmCd', '상세 확인 필요'),
                "target_age": "자격요건 확인",
                "target_income": "기준중위소득 확인",
                "target_house": "대상 조건 확인",
                "requirements": [item.get('tgTrgtDtl', '상세 안내 페이지 참조')],
                "selection_criteria": item.get('slctCritDtl', '공식 신청 페이지 참조'),
                "exclusions": ["중복 수혜 여부 확인 필요"],
                "documents": ["신분증", "주민등록등본"],
                "provider": "행정안전부 / 지자체",
                "dday": "상시모집",
                "apply_url": item.get('servDtlLink', 'https://www.gov.kr')
            }
            supabase.table('welfare_services').upsert(record, on_conflict='service_id').execute()
        print("✅ 보조금24 데이터 수집 및 저장 완료")
    except Exception as e:
        print(f"❌ 보조금24 데이터 수집 실패: {e}")

if __name__ == "__main__":
    fetch_and_upsert_subsidies()
