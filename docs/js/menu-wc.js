'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">prosemirror-angular documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-a9975ab6308f4ec7ca7c19277d67540ad6e14c243b8b597eb6739a7e28569382ddbd19841c2a9f3f291927ac69e32d5506f0f3da8073b3cb3ffd086e86a9d46b"' : 'data-bs-target="#xs-components-links-module-AppModule-a9975ab6308f4ec7ca7c19277d67540ad6e14c243b8b597eb6739a7e28569382ddbd19841c2a9f3f291927ac69e32d5506f0f3da8073b3cb3ffd086e86a9d46b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-a9975ab6308f4ec7ca7c19277d67540ad6e14c243b8b597eb6739a7e28569382ddbd19841c2a9f3f291927ac69e32d5506f0f3da8073b3cb3ffd086e86a9d46b"' :
                                            'id="xs-components-links-module-AppModule-a9975ab6308f4ec7ca7c19277d67540ad6e14c243b8b597eb6739a7e28569382ddbd19841c2a9f3f291927ac69e32d5506f0f3da8073b3cb3ffd086e86a9d46b"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuCreateTableElementItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuCreateTableElementItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuCreateTableItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuCreateTableItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuDeleteTableElementItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuDeleteTableElementItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuImageItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuImageItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuIndentItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuIndentItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuLinkItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuLinkItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuListItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuListItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuMarkItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuMarkItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuNodeItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuNodeItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuRemoveElementItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuRemoveElementItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuSchemaItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuSchemaItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuToggleTableHeaderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuToggleTableHeaderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuWrapItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuWrapItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TextEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TextEditorComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AncestorNodeList.html" data-type="entity-link" >AncestorNodeList</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});