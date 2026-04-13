(function () {
    var ADDON_ID = 'addon-themer';
    var THEME_CONFIG_URL = window.txNuiAddonApi.getStaticUrl(ADDON_ID, 'theme.json');
    var menuLogoUrl = window.txNuiAddonApi.getStaticUrl(ADDON_ID, 'snaily.gif');
    var appliedNuiVarNames = [];
    var nuiThemeEnabled = false;

    function setEnabled(enabled) {
        nuiThemeEnabled = Boolean(enabled);
        if (nuiThemeEnabled) {
            document.documentElement.dataset.addonThemerEnabled = 'true';
        } else {
            delete document.documentElement.dataset.addonThemerEnabled;
        }
    }

    function clearAppliedVars() {
        appliedNuiVarNames.forEach(function (name) {
            document.documentElement.style.removeProperty(name);
        });
        appliedNuiVarNames = [];
    }

    function getMenuLogoUrl(config) {
        var configuredLogo = config && config.branding && config.branding.nuiLogo;
        if (typeof configuredLogo !== 'string' || !configuredLogo.trim()) {
            return window.txNuiAddonApi.getStaticUrl(ADDON_ID, 'snaily.gif');
        }
        return window.txNuiAddonApi.getStaticUrl(ADDON_ID, configuredLogo.trim());
    }

    function restoreMenuLogos(root) {
        (root || document).querySelectorAll('img[data-addon-themer="menu-logo"]').forEach(function (img) {
            var original = img.dataset.addonThemerOriginalSrc;
            if (original) {
                img.setAttribute('src', original);
            }
            delete img.dataset.addonThemer;
        });
    }

    function applyNuiTheme(config) {
        menuLogoUrl = getMenuLogoUrl(config);
        clearAppliedVars();
        setEnabled(Boolean(config && config.enabled));

        if (!nuiThemeEnabled) {
            restoreMenuLogos(document);
            return;
        }

        var nuiTheme = config && config.nui && typeof config.nui === 'object' ? config.nui : {};
        Object.keys(nuiTheme).forEach(function (name) {
            var value = nuiTheme[name];
            if (typeof value === 'string') {
                document.documentElement.style.setProperty(name, value);
                appliedNuiVarNames.push(name);
            }
        });
    }

    function loadThemeConfig() {
        return fetch(THEME_CONFIG_URL)
            .then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.json();
            })
            .catch(function (error) {
                console.warn('[addon-themer] Failed to load NUI theme config:', error);
                return null;
            });
    }

    function markMenuShell(img) {
        var shell = img.parentElement;
        while (shell && !shell.querySelector('.MuiTabs-root')) {
            shell = shell.parentElement;
        }
        if (shell) {
            shell.dataset.addonThemerShell = 'menu-shell';
        }
    }

    function replaceMenuLogos(root) {
        if (!nuiThemeEnabled) return;
        root.querySelectorAll('img[alt="fxPanel logo"]').forEach(function (img) {
            if (!img.dataset.addonThemerOriginalSrc) {
                img.dataset.addonThemerOriginalSrc = img.getAttribute('src') || '';
            }
            if (img.getAttribute('src') !== menuLogoUrl) {
                img.setAttribute('src', menuLogoUrl);
            }
            img.dataset.addonThemer = 'menu-logo';
            markMenuShell(img);
        });
    }

    function startBranding() {
        loadThemeConfig().then(function (config) {
            if (config) {
                applyNuiTheme(config);
            }

            replaceMenuLogos(document);

            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    mutation.addedNodes.forEach(function (node) {
                        if (!(node instanceof Element)) return;
                        if (nuiThemeEnabled) {
                            if (node.matches && node.matches('img[alt="fxPanel logo"]')) {
                                replaceMenuLogos(document);
                                return;
                            }
                            if (node.querySelector) {
                                replaceMenuLogos(node);
                            }
                        }
                    });
                });
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startBranding, { once: true });
    } else {
        startBranding();
    }
})();
