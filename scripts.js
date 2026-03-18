document.addEventListener('DOMContentLoaded', () => {
    // Internationalization (i18n)
    const translations = {
        'en': {
            'nav-home': 'versutus',
            'nav-commission': 'commission',
            'nav-downloads': 'downloads',
            'intro-wonderstruck': 'wonderstruck',
            'intro-musician': 'musician',
            'intro-portfolio': 'portfolio manager',
            'intro-engineer': 'engineer',
            'intro-entrepreneur': 'entrepreneur',
            'calc-title': 'estimated price',
            'calc-unit': 'SGD',
            'bubble-melody': 'melody',
            'bubble-lyrics': 'lyrics',
            'bubble-production': 'production',
            'bubble-mix': 'mix',
            'bubble-vocal-edit': 'vocal edit',
            'bubble-versutus-vocals': 'versutus vocals',
            'bulk-full-stack': 'full stack',
            'bulk-full-mix': 'full mix',
            'label-length': 'song length',
            'label-instr': 'number of main instrumental tracks',
            'label-vocals': 'number of vocal tracks',
            'calc-footer': 'the price quoted above is an estimate. please contact versutus0@gmail.com with project details and files to order',
            'terms-back': 'back',
            'terms-p1': 'you may use my instrumentals in your covers for free; you may distribute to streaming platforms, but <b>PLEASE DO NOT LIST ME AS A PRIMARY ARTIST</b>',
            'terms-p2': 'under contributors, you may credit "Versutus Vision" as producer if you want',
            'terms-p3': 'on other platforms, i would appreciate if you credit me and link my profile',
            'terms-p4': 'if you have any questions, contact me.',
            'terms-p5': 'if you make money using my work please consider donating ^_^',
            'donate': 'donate',
            'downloads-title': 'downloads (pre-release; temporary links)',
            'no-downloads': 'no downloads for now',
            'terms-link': 'terms of use',
            'label-associate': 'associate pricing',
            'tooltip-associate': 'referred by existing associate or from second project onwards: 80% discount'
        },
        'zh-Hans': {
            'nav-home': 'versutus',
            'nav-commission': '委托',
            'nav-downloads': '下载',
            'intro-wonderstruck': 'wonderstruck',
            'intro-musician': '音乐人',
            'intro-portfolio': '投资经理',
            'intro-engineer': '工程师',
            'intro-entrepreneur': '创业者',
            'calc-title': '预估价格',
            'calc-unit': 'SGD',
            'bubble-melody': '旋律',
            'bubble-lyrics': '作词',
            'bubble-production': '编曲',
            'bubble-mix': '混音',
            'bubble-vocal-edit': '修音',
            'bubble-versutus-vocals': 'versutus 人声',
            'bulk-full-stack': '全套',
            'bulk-full-mix': '全套混音',
            'label-length': '歌曲长度',
            'label-instr': '主分轨数量',
            'label-vocals': '人声轨道数量',
            'calc-footer': '以上报价仅为预估。下单前请将项目详情和文件发送至 versutus0@gmail.com',
            'terms-back': '返回',
            'terms-p1': '你可以免费在翻唱中使用我的伴奏；你可以发布到流媒体平台，但<b>请不要将我列为主要艺术家</b>',
            'terms-p2': '在贡献者中，如果愿意，你可以标注 "Versutus Vision" 为制作人',
            'terms-p3': '在其他平台，如果你能署名并链接我的个人资料，我将不胜感激',
            'terms-p4': '如果你有任何问题，请联系我。',
            'terms-p5': '如果你通过我的作品赚了钱，请考虑捐赠 ^_^',
            'donate': '捐赠',
            'downloads-title': '下载 (预发布；临时链接)',
            'no-downloads': '目前没有下载',
            'terms-link': '使用条款',
            'label-associate': '伙伴价格',
            'tooltip-associate': '由现有伙伴推荐，或从第二个项目起：8折'
        },
        'zh-Hant': {
            'nav-home': 'versutus',
            'nav-commission': '委託',
            'nav-downloads': '下載',
            'intro-wonderstruck': 'wonderstruck',
            'intro-musician': '音樂人',
            'intro-portfolio': '投資經理',
            'intro-engineer': '工程師',
            'intro-entrepreneur': '創業者',
            'calc-title': '預估價格',
            'calc-unit': 'SGD',
            'bubble-melody': '旋律',
            'bubble-lyrics': '作詞',
            'bubble-production': '編曲',
            'bubble-mix': '混音',
            'bubble-vocal-edit': '修音',
            'bubble-versutus-vocals': 'versutus 人聲',
            'bulk-full-stack': '全套',
            'bulk-full-mix': '全套混音',
            'label-length': '歌曲長度',
            'label-instr': '主分軌數量',
            'label-vocals': '人聲軌道數量',
            'calc-footer': '以上報價僅為預估。下單前請將項目詳情和文件發送至 versutus0@gmail.com',
            'terms-back': '返回',
            'terms-p1': '你可以免費在翻唱中使用我的伴奏；你可以發佈到流媒體平台，但<b>請不要將我列為主要藝術家</b>',
            'terms-p2': '在貢獻者中，如果願意，你可以標註 "Versutus Vision" 為製作人',
            'terms-p3': '在其他平台，如果你能署名並鏈接我的個人資料，我將不勝感激',
            'terms-p4': '如果你有任何問題，請聯繫我。',
            'terms-p5': '如果你通過我的作品賺了錢，請考慮捐贈 ^_^',
            'donate': '捐贈',
            'downloads-title': '下載 (預發佈；臨時鏈接)',
            'no-downloads': '目前沒有下載',
            'terms-link': '使用條款',
            'label-associate': '伙伴價格',
            'tooltip-associate': '由現有夥伴推薦，或從第二個項目起：8折'
        }
    };

    function setLanguage(lang) {
        localStorage.setItem('versutus-lang', lang);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
                    el.value = translations[lang][key];
                } else {
                    el.innerHTML = translations[lang][key];
                }
            }
        });
        document.documentElement.lang = lang;
    }

    const savedLang = localStorage.getItem('versutus-lang') || 'en';
    const langSelector = document.getElementById('language-selector');
    if (langSelector) {
        langSelector.value = savedLang;
        langSelector.addEventListener('change', (e) => setLanguage(e.target.value));
    }
    setLanguage(savedLang);

    // Calculator Logic, input hours taken for 1 minute of music
    const priceDisplay = document.getElementById('estimated-price');
    if (priceDisplay) {
        const bubbles = {
            melody: { weight: 1, element: document.getElementById('bubble-melody') },
            lyrics: { weight: 2, element: document.getElementById('bubble-lyrics') },
            production: { weight: (v) => 2 * v, element: document.getElementById('bubble-production'), valSource: 'instr-tracks' },
            mix: { weight: (v) => 0.5 * v, element: document.getElementById('bubble-mix'), valSource: 'both' },
            vocalEdit: { weight: (v) => 1 * v, element: document.getElementById('bubble-vocal-edit'), valSource: 'vocal-tracks' },
            versutusVocals: { weight: (v) => 1 * v, element: document.getElementById('bubble-versutus-vocals'), valSource: 'vocal-tracks' }
        };

        const sliders = {
            length: document.getElementById('song-length'),
            instr: document.getElementById('instr-tracks'),
            vocals: document.getElementById('vocal-tracks')
        };

        const bulk = {
            fullStack: document.getElementById('bulk-full-stack'),
            fullMix: document.getElementById('bulk-full-mix'),
            associate: document.getElementById('associate-pricing')
        };

        function updatePrice() {
            let sumWeights = 0;
            const instrVal = parseInt(sliders.instr.value);
            const vocalVal = parseInt(sliders.vocals.value);
            const lengthMinutes = parseFloat(sliders.length.value) / 60;

            for (let key in bubbles) {
                if (bubbles[key].element.classList.contains('active')) {
                    const w = bubbles[key].weight;
                    if (typeof w === 'function') {
                        let val;
                        if (bubbles[key].valSource === 'both') {
                            val = instrVal + vocalVal;
                        } else {
                            val = bubbles[key].valSource === 'instr-tracks' ? instrVal : vocalVal;
                        }
                        sumWeights += w(val);
                    } else {
                        sumWeights += w;
                    }
                }
            }

            const coefficient = 4 * sumWeights;
            let price = 30 / 2 * Math.pow(lengthMinutes * coefficient, 0.8);

            // Associate discounts
            if (bulk.associate.checked) {
                price *= 0.8;
            }

            priceDisplay.textContent = price.toFixed(2);
        }

        // Toggle bubbles
        Object.keys(bubbles).forEach(key => {
            bubbles[key].element.addEventListener('click', () => {
                bubbles[key].element.classList.toggle('active');

                // Dependencies
                if (key === 'production' && bubbles.production.element.classList.contains('active')) {
                    bubbles.mix.element.classList.add('active');
                }
                if (key === 'versutusVocals' && bubbles.versutusVocals.element.classList.contains('active')) {
                    bubbles.vocalEdit.element.classList.add('active');
                }

                updatePrice();
            });
        });

        // Sliders
        Object.values(sliders).forEach(slider => {
            slider.addEventListener('input', (e) => {
                const label = e.target.nextElementSibling;
                if (label && label.tagName === 'SPAN') {
                    let val = e.target.value;
                    if (e.target.id === 'song-length') {
                        const m = Math.floor(val / 60);
                        const s = val % 60;
                        label.textContent = `${m}:${s.toString().padStart(2, '0')}${val >= 300 ? '+' : ''}`;
                    } else if (e.target.id === 'instr-tracks') {
                        label.textContent = `${val}${val >= 20 ? '+' : ''}`;
                    } else if (e.target.id === 'vocal-tracks') {
                        label.textContent = `${val}${val >= 20 ? '+' : ''}`;
                    }
                }
                updatePrice();
            });
        });

        // Bulk select
        bulk.fullStack.addEventListener('click', () => {
            const allSelected = Object.values(bubbles).every(b => b.element.classList.contains('active'));
            if (allSelected) {
                Object.values(bubbles).forEach(b => b.element.classList.remove('active'));
            } else {
                Object.values(bubbles).forEach(b => b.element.classList.add('active'));
            }
            updatePrice();
        });

        bulk.fullMix.addEventListener('click', () => {
            const mixActive = bubbles.mix.element.classList.contains('active');
            const vocalEditActive = bubbles.vocalEdit.element.classList.contains('active');
            const othersActive = Object.keys(bubbles)
                .filter(k => k !== 'mix' && k !== 'vocalEdit')
                .some(k => bubbles[k].element.classList.contains('active'));

            if (mixActive && vocalEditActive && !othersActive) {
                bubbles.mix.element.classList.remove('active');
                bubbles.vocalEdit.element.classList.remove('active');
            } else {
                Object.values(bubbles).forEach(b => b.element.classList.remove('active'));
                bubbles.mix.element.classList.add('active');
                bubbles.vocalEdit.element.classList.add('active');
            }
            updatePrice();
        });

        bulk.associate.addEventListener('change', updatePrice);

        updatePrice();
    }

    const emailButton = document.getElementById('email-button');

    function copyEmail() {
        const email = emailButton.textContent;
        navigator.clipboard.writeText(email).then(() => {
            emailButton.textContent = 'copied!';
            setTimeout(() => {
                emailButton.textContent = 'versutus0@gmail.com';
            }, 500);
        }).catch(err => {
            console.error('Failed to copy email: ', err);
        });
    }

    if (emailButton) {
        emailButton.addEventListener('click', copyEmail);
    }
});
