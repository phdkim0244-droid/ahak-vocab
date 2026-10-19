# 검증 스크린샷 (2026-10-19, 헤드리스 Chrome 375×812)

| 파일 | 조건 |
|---|---|
| local-vocab-offline.png | 로컬 서버를 **끈 뒤** 서비스 워커 캐시만으로 어휘력 앱 로드 |
| local-card-offline-nohash.png | 로컬 서버를 끈 뒤, 학급 해시 없이 어휘카드 재진입 → 설정 유지 |
| deploy-vocab-online.png / deploy-card-online.png | 배포 주소 첫 로드, 서비스 워커 activated·프리캐시 8/9개 완료 |
| deploy-vocab-offline.png / deploy-card-offline-nohash.png | 배포 주소에서 네트워크 오프라인 에뮬레이션(캐시에 없는 URL fetch 실패 확인) 상태로 로드 |

내장 브라우저(Claude 데스크톱)는 서비스 워커 스크립트 fetch를 막아 등록이 안 되므로, CDP로 헤드리스 Chrome을 제어해 검증했다. 콘솔 오류 없음.
